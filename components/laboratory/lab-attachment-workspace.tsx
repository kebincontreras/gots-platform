"use client"

import { useState } from "react"

/** Development preview only: it never reads a user-selected file. */
export function LabAttachmentWorkspace() {
  const [experiments, setExperiments] = useState<any[]>([])
  const [attachments, setAttachments] = useState<Record<string, any[]>>({})
  const [message, setMessage] = useState("El preview sólo permite adjuntar el SVG sintético empaquetado.")
  const request = async (url: string, init?: RequestInit) => {
    const response = await fetch(url, init)
    const body = await response.json()
    if (!response.ok) throw new Error(body.error ?? "attachment-request-failed")
    return body
  }
  const loadExperiments = async () => { try { setExperiments((await request("/api/labs/experiments")).experiments); setMessage("Experimentos locales cargados.") } catch (error: any) { setMessage(`Operación rechazada: ${error.message}`) } }
  const loadAttachments = async (id: string) => { try { const body=await request(`/api/labs/experiments/${id}/attachments`); setAttachments((current)=>({...current,[id]:body.attachments})); setMessage("Adjuntos locales cargados.") } catch (error:any) { setMessage(`Operación rechazada: ${error.message}`) } }
  const attachFixture = async (id: string) => { try { const body=await request(`/api/labs/experiments/${id}/attachments`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({localPath:"/labs-fixtures/laser.svg",mediaType:"image/svg+xml"})});setAttachments((current)=>({...current,[id]:[...(current[id]??[]),body.attachment]}));setMessage("Imagen sintética adjuntada; no se subió un archivo de usuario.") } catch(error:any) { setMessage(`Operación rechazada: ${error.message}`) } }
  const uploadLocal = async (id: string, file?: File) => { if (!file) return; try { const form=new FormData();form.set("file",file);const body=await request(`/api/labs/experiments/${id}/attachments`,{method:"POST",body:form});setAttachments((current)=>({...current,[id]:[...(current[id]??[]),body.attachment]}));setMessage("Archivo local sintético adjuntado.") } catch(error:any) { setMessage(`Operación rechazada: ${error.message}`) } }
  return <section className="mt-6 rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Imágenes locales</h2><p className="mt-2 text-sm text-muted-foreground">Puedes adjuntar un JPEG, PNG o WebP sintético local (máximo 5 MiB); no se aceptan URLs externas. Sólo propietario o colaborador aprobado puede acceder.</p><button className="mt-3 rounded border px-3 py-2 text-sm" onClick={loadExperiments}>Cargar mis experimentos</button><div className="mt-3 space-y-2">{experiments.map((experiment)=><div key={experiment.id} className="rounded bg-muted p-3 text-sm"><b>{experiment.title}</b><div className="mt-2 flex flex-wrap gap-3"><button className="underline" onClick={()=>attachFixture(experiment.id)}>Adjuntar SVG sintético</button><label className="underline cursor-pointer">Subir archivo sintético<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>{const file=event.target.files?.[0];event.currentTarget.value="";uploadLocal(experiment.id,file)}} /></label><button className="underline" onClick={()=>loadAttachments(experiment.id)}>Ver adjuntos</button></div>{attachments[experiment.id]?.map((attachment)=><a className="mt-2 block underline" key={attachment.id} href={attachment.download_url??attachment.local_path} target="_blank" rel="noreferrer">{attachment.local_path} ({attachment.size_bytes} bytes)</a>)}</div>)}</div><p className="mt-4 text-sm" role="status">{message}</p></section>
}
