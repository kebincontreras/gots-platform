import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import { createLocalLabFixtureStore } from "../lib/lab-local-fixture-store.mjs"
import { validateLocalExperimentUpload } from "../lib/lab-local-upload-storage.mjs"

test("isolated fixtures persist experiments, local images, internal notices, and simulated acceptance across restart", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gots-labs-fixture-")); const dbPath = path.join(dir, "labs.sqlite")
  let store = createLocalLabFixtureStore(dbPath)
  store.addExperiment({ id:"e1", ownerId:"fixture-user", title:"Interferencia local" })
  store.grantMembership({ userId:"fixture-user" }); assert.equal(store.getMembership("fixture-user").scope,"approved"); assert.equal(store.getMembership("unapproved"),null)
  store.ensureInventoryFixtures(); assert.equal(store.listInventory().length,2); assert.equal(store.listInventory().find((item)=>item.id==="fixture-laser-01").quantity_total,5); assert.throws(()=>store.reserveInventory({id:"fixture-laser-01",quantity:6}),/insufficient/)
  store.addSyntheticImage({ id:"a1", experimentId:"e1", actorId:"fixture-user", localPath:"/labs-fixtures/laser.svg", mediaType:"image/svg+xml" })
  store.createInternalNotification({ id:"n1", userId:"fixture-user", type:"experiment-created", body:"Aviso local sin envío" })
  store.recordSimulatedAcceptance({ id:"l1", experimentId:"e1", userId:"fixture-user" })
  store.close(); store = createLocalLabFixtureStore(dbPath)
  assert.equal(store.listExperiments("fixture-user")[0].title, "Interferencia local")
  assert.equal(store.getMembership("fixture-user").scope,"approved"); assert.equal(store.listInventory().find((item)=>item.id==="fixture-laser-01").quantity_available,5)
  assert.equal(store.listSyntheticImages({experimentId:"e1",actorId:"fixture-user"})[0].local_path, "/labs-fixtures/laser.svg")
  assert.equal(store.listInternalNotifications("fixture-user")[0].body, "Aviso local sin envío")
  assert.ok(store.markInternalNotificationRead({id:"n1",userId:"fixture-user"}).read_at)
  assert.throws(()=>store.markInternalNotificationRead({id:"n1",userId:"other"}),/not-found-or-already-read/)
  assert.equal(store.listSimulatedAcceptances("e1")[0].simulated, 1)
  assert.throws(() => store.addSyntheticImage({ id:"a2", experimentId:"e1", actorId:"fixture-user", localPath:"/labs-fixtures/../secret.svg", mediaType:"image/svg+xml" }), /not-allowed/)
  store.close(); fs.rmSync(dir, { recursive:true, force:true })
})

test("pending loan persists a transactional reservation and return releases it", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-loan-")); const dbPath=path.join(dir,"labs.sqlite"); let store=createLocalLabFixtureStore(dbPath)
  store.ensureInventoryFixtures(); store.grantLoanResponsible({userId:"prof-uuid"})
  const loan=store.createLoan({id:"loan-uuid",requesterId:"member-uuid",professorId:"prof-uuid",itemIds:["fixture-laser-01"],purposeDescription:"Prueba local de préstamo con propósito válido.",usageStart:"2027-01-01T09:00:00.000Z",usageEnd:"2027-01-02T09:00:00.000Z",simulatedAcceptance:true})
  assert.equal(loan.status,"pending"); assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,4)
  assert.throws(()=>store.createLoan({id:"double",requesterId:"other",professorId:"prof-uuid",items:[{inventoryItemId:"fixture-laser-01",quantity:5}],purposeDescription:"Propósito de prueba suficientemente largo.",usageStart:"2027-01-03T09:00:00.000Z",usageEnd:"2027-01-04T09:00:00.000Z",simulatedAcceptance:true}),/insufficient/)
  store.decideLoan({loanId:"loan-uuid",professorId:"prof-uuid",decision:"approved"}); store.close(); store=createLocalLabFixtureStore(dbPath)
  assert.equal(store.getLoan("loan-uuid").status,"approved"); assert.equal(store.returnLoan({loanId:"loan-uuid",actorId:"member-uuid",isResponsible:false}).status,"returned"); assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,5)
  store.close(); fs.rmSync(dir,{recursive:true,force:true})
})

test("loan rejects forged responsibility, omitted simulated acknowledgement, and invalid transitions", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-loan-negative-")); const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite")); store.ensureInventoryFixtures(); store.grantLoanResponsible({userId:"prof-uuid"})
  assert.throws(()=>store.createLoan({id:"bad",requesterId:"member",professorId:"prof-uuid",itemIds:["fixture-laser-01"],purposeDescription:"Propósito de prueba suficientemente largo.",usageStart:"2027-01-02",usageEnd:"2027-01-01",simulatedAcceptance:false}),/loan-invalid-request/)
  const loan=store.createLoan({id:"good",requesterId:"member",professorId:"prof-uuid",itemIds:["fixture-laser-01"],purposeDescription:"Propósito de prueba suficientemente largo.",usageStart:"2027-01-01",usageEnd:"2027-01-02",simulatedAcceptance:true})
  assert.throws(()=>store.decideLoan({loanId:loan.id,professorId:"attacker",decision:"approved"}),/forbidden/); assert.throws(()=>store.returnLoan({loanId:loan.id,actorId:"member",isResponsible:false}),/transition-not-allowed/)
  assert.equal(store.decideLoan({loanId:loan.id,professorId:"prof-uuid",decision:"rejected"}).status,"rejected"); assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").available,true)
  store.close(); fs.rmSync(dir,{recursive:true,force:true})
})

test("loan extension follows requester then responsible approval or rejection", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-extension-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.ensureInventoryFixtures();store.grantLoanResponsible({userId:"prof"});const loan=store.createLoan({id:"extension",requesterId:"member",professorId:"prof",itemIds:["fixture-laser-01"],purposeDescription:"Propósito válido para extensión local.",usageStart:"2027-01-01T09:00:00.000Z",usageEnd:"2027-01-02T09:00:00.000Z",simulatedAcceptance:true});store.decideLoan({loanId:loan.id,professorId:"prof",decision:"approved"});assert.throws(()=>store.requestLoanExtension({loanId:loan.id,requesterId:"member",newUsageEnd:"2027-01-01T09:00:00.000Z"}),/invalid-date/);store.requestLoanExtension({loanId:loan.id,requesterId:"member",newUsageEnd:"2027-01-03T09:00:00.000Z"});assert.equal(store.resolveLoanExtension({loanId:loan.id,professorId:"prof",approve:false}).usage_end,"2027-01-02T09:00:00.000Z");store.requestLoanExtension({loanId:loan.id,requesterId:"member",newUsageEnd:"2027-01-03T09:00:00.000Z"});assert.equal(store.resolveLoanExtension({loanId:loan.id,professorId:"prof",approve:true}).usage_end,"2027-01-03T09:00:00.000Z");store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("experiment sessions block finishing while open and finalization returns reserved equipment across restart", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-experiment-"));const dbPath=path.join(dir,"labs.sqlite");let store=createLocalLabFixtureStore(dbPath);store.ensureInventoryFixtures();store.addExperiment({id:"exp",ownerId:"owner",title:"Sesión local"});store.startExperiment({experimentId:"exp",ownerId:"owner",simulatedAcceptance:true});store.addExperimentItem({id:"item",experimentId:"exp",actorId:"owner",inventoryItemId:"fixture-laser-01"});store.openExperimentSession({id:"session",experimentId:"exp",ownerId:"owner",startedAt:"2027-01-01T09:00:00.000Z",plannedEnd:"2027-01-01T10:00:00.000Z"});assert.throws(()=>store.finishExperiment({experimentId:"exp",ownerId:"owner"}),/open-session/);assert.throws(()=>store.openExperimentSession({id:"other",experimentId:"exp",ownerId:"owner",startedAt:"2027-01-01T09:30:00.000Z",plannedEnd:"2027-01-01T10:30:00.000Z"}),/open-session/);store.closeExperimentSession({sessionId:"session",ownerId:"owner",endedAt:"2027-01-01T10:00:00.000Z"});store.finishExperiment({experimentId:"exp",ownerId:"owner"});store.close();store=createLocalLabFixtureStore(dbPath);assert.equal(store.getExperiment("exp").status,"finished");assert.equal(store.getExperiment("exp").items[0].status,"returned");assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").available,true);store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("approved collaborator may reserve equipment but cannot resolve their own access request", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-collaborator-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.ensureInventoryFixtures();store.addExperiment({id:"exp-c",ownerId:"owner",title:"Colaboración"});store.startExperiment({experimentId:"exp-c",ownerId:"owner",simulatedAcceptance:true});store.requestExperimentAccess({id:"participant",experimentId:"exp-c",userId:"partner"});assert.throws(()=>store.resolveExperimentAccess({participantId:"participant",ownerId:"partner",status:"approved"}),/owner-required/);store.resolveExperimentAccess({participantId:"participant",ownerId:"owner",status:"approved"});assert.equal(store.addExperimentItem({id:"collab-item",experimentId:"exp-c",actorId:"partner",inventoryItemId:"fixture-laser-01"}).items[0].added_by,"partner");store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("shared multiunit stock rejects invalid and competing pending reservations, then releases on rejection", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-quantity-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.ensureInventoryFixtures();store.grantLoanResponsible({userId:"prof"})
  assert.throws(()=>store.createLoan({id:"zero",requesterId:"a",professorId:"prof",items:[{inventoryItemId:"fixture-laser-01",quantity:0}],purposeDescription:"Propósito local suficientemente largo.",usageStart:"2027-01-01",usageEnd:"2027-01-02",simulatedAcceptance:true}),/invalid-quantity/)
  const first=store.createLoan({id:"first",requesterId:"a",professorId:"prof",items:[{inventoryItemId:"fixture-laser-01",quantity:3}],purposeDescription:"Propósito local suficientemente largo.",usageStart:"2027-01-01",usageEnd:"2027-01-02",simulatedAcceptance:true})
  assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,2)
  assert.throws(()=>store.createLoan({id:"second",requesterId:"b",professorId:"prof",items:[{inventoryItemId:"fixture-laser-01",quantity:3}],purposeDescription:"Segundo propósito local suficientemente largo.",usageStart:"2027-01-01",usageEnd:"2027-01-02",simulatedAcceptance:true}),/insufficient/)
  store.decideLoan({loanId:first.id,professorId:"prof",decision:"rejected"});assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,5);store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("loan and experiment reservations share aggregate stock and experiment completion releases it", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-shared-stock-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.ensureInventoryFixtures();store.grantLoanResponsible({userId:"prof"})
  store.createLoan({id:"loan",requesterId:"member",professorId:"prof",items:[{inventoryItemId:"fixture-laser-01",quantity:2}],purposeDescription:"Propósito local suficientemente largo.",usageStart:"2027-01-01",usageEnd:"2027-01-02",simulatedAcceptance:true})
  store.addExperiment({id:"exp-q",ownerId:"owner",title:"Cantidad compartida"});store.startExperiment({experimentId:"exp-q",ownerId:"owner",simulatedAcceptance:true});store.addExperimentItem({id:"exp-item",experimentId:"exp-q",actorId:"owner",inventoryItemId:"fixture-laser-01",quantity:3})
  assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,0)
  store.finishExperiment({experimentId:"exp-q",ownerId:"owner"});assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,3)
  store.decideLoan({loanId:"loan",professorId:"prof",decision:"approved"});store.returnLoan({loanId:"loan",actorId:"member",isResponsible:false});assert.equal(store.listInventory().find(i=>i.id==="fixture-laser-01").quantity_available,5);store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("synthetic attachments allow only an approved experiment editor and exact packaged assets", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-attachments-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.addExperiment({id:"attachment-exp",ownerId:"owner",title:"Adjuntos locales"})
  assert.throws(()=>store.addSyntheticImage({id:"bad-actor",experimentId:"attachment-exp",actorId:"intruder",localPath:"/labs-fixtures/laser.svg",mediaType:"image/svg+xml"}),/approved-participant-required/)
  assert.throws(()=>store.addSyntheticImage({id:"bad-type",experimentId:"attachment-exp",actorId:"owner",localPath:"/labs-fixtures/laser.svg",mediaType:"image/png"}),/not-allowed/)
  const attachment=store.addSyntheticImage({id:"good",experimentId:"attachment-exp",actorId:"owner",localPath:"/labs-fixtures/laser.svg",mediaType:"image/svg+xml"});assert.equal(attachment.size_bytes,1391)
  assert.throws(()=>store.listSyntheticImages({experimentId:"attachment-exp",actorId:"intruder"}),/approved-participant-required/)
  store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("local multipart attachment validation rejects MIME spoofing and upload access remains editor-only", async () => {
  const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlK5WQAAAAASUVORK5CYII=","base64");const valid=await validateLocalExperimentUpload(new File([png],"synthetic.png",{type:"image/png"}),png);assert.equal(valid.extension,"png")
  await assert.rejects(()=>validateLocalExperimentUpload(new File([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])],"spoof.png",{type:"image/png"}),Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])),/content-not-allowed/)
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-upload-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.addExperiment({id:"upload-exp",ownerId:"owner",title:"Carga local"})
  assert.throws(()=>store.addLocalUpload({id:"up",experimentId:"upload-exp",actorId:"intruder",storageKey:"00000000-0000-4000-8000-000000000000.png",mediaType:"image/png",sizeBytes:png.length}),/approved-participant-required/)
  const uploaded=store.addLocalUpload({id:"up",experimentId:"upload-exp",actorId:"owner",storageKey:"00000000-0000-4000-8000-000000000000.png",mediaType:"image/png",sizeBytes:png.length});assert.equal(store.getLocalUpload({attachmentId:uploaded.id,actorId:"owner"}).storage_key,"00000000-0000-4000-8000-000000000000.png")
  store.close();fs.rmSync(dir,{recursive:true,force:true})
})

test("only a fixture lab admin can persist membership grants", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"gots-labs-admin-"));const store=createLocalLabFixtureStore(path.join(dir,"labs.sqlite"));store.grantLabAdmin({userId:"admin"});assert.throws(()=>store.setLabMembership({actorId:"member",userId:"target",scope:"approved"}),/lab-admin-required/);assert.equal(store.setLabMembership({actorId:"admin",userId:"target",scope:"approved"}).scope,"approved");assert.equal(store.listLabMemberships({actorId:"admin"}).memberships[0].gots_user_id,"target");store.close();fs.rmSync(dir,{recursive:true,force:true})
})
