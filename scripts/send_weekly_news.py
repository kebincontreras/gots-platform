#!/usr/bin/env python3
import json
import os
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
NEWS_PATH = ROOT / "public" / "Noticias" / "news.json"
TEAM_PATH = ROOT / "public" / "equipo.json"


def load_json(path: Path):
  with path.open("r", encoding="utf-8") as fh:
    return json.load(fh)


def is_valid_email(value: str) -> bool:
  value = (value or "").strip()
  return "@" in value and "." in value.split("@")[-1]


def load_recipients() -> list[str]:
  env_recipients = os.getenv("RECIPIENTS", "").strip()
  if env_recipients:
    values = [x.strip() for x in env_recipients.split(",")]
    return sorted({v for v in values if is_valid_email(v)})

  data = load_json(TEAM_PATH)
  team = data.get("team", [])
  emails = []
  for member in team:
    if not member.get("activo", True):
      continue
    email = (member.get("email") or "").strip()
    if is_valid_email(email):
      emails.append(email)
  return sorted(set(emails))


def parse_news_date(raw: str):
  try:
    return datetime.strptime(raw, "%Y-%m-%d").date()
  except Exception:
    return None


def build_news_block(news_items: list[dict], news_url: str) -> tuple[str, str]:
  today = datetime.utcnow().date()
  week_ago = today - timedelta(days=7)

  dated = []
  for item in news_items:
    dt = parse_news_date(item.get("date", ""))
    if dt is None:
      continue
    dated.append((dt, item))

  dated.sort(key=lambda x: x[0], reverse=True)
  last_week = [item for dt, item in dated if dt >= week_ago]
  selected = last_week[:3] if last_week else [dated[0][1]] if dated else []

  if not selected:
    return "Actualizaciones del grupo GOTS", "<li>Visita la sección de noticias para más información.</li>"

  subject_title = selected[0].get("title", "Noticias GOTS")
  items_html = []
  for item in selected:
    title = item.get("title", "Sin título")
    summary = item.get("summary") or item.get("description") or ""
    date_text = item.get("dateFormatted") or item.get("date") or ""
    items_html.append(
      f"<li><strong>{title}</strong><br>{summary}<br><em>{date_text}</em></li>"
    )
  return subject_title, "\n".join(items_html)


def send_email():
  smtp_user = os.getenv("SMTP_USER", "").strip()
  smtp_pass = os.getenv("SMTP_PASS", "").strip()
  from_name = os.getenv("FROM_NAME", "GOTS Research Group").strip()
  site_url = os.getenv(
    "NEWS_URL",
    "https://gotsresearchgroup-beep.github.io/GOTS.github.io/noticias",
  ).strip()
  send_mode = os.getenv("SEND_MODE", "preview").strip().lower()
  test_recipient = os.getenv("TEST_RECIPIENT", "").strip()

  if not smtp_user or not smtp_pass:
    raise RuntimeError("Missing SMTP_USER or SMTP_PASS secret.")

  recipients = load_recipients()
  if not recipients:
    raise RuntimeError("No recipients found. Add RECIPIENTS or valid emails in equipo.json.")

  news_data = load_json(NEWS_PATH)
  news_items = news_data.get("news", [])
  subject_title, items_html = build_news_block(news_items, site_url)

  subject = f"[GOTS] Noticias de la semana: {subject_title}"
  html = f"""
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Noticias semanales - GOTS</h2>
      <p>Ya está disponible la actualización semanal del grupo.</p>
      <p>Para ver la noticia y el contador en vivo del seminario, entra aquí:</p>
      <p>
        <a href="{site_url}" style="background:#0f766e;color:#fff;padding:10px 14px;text-decoration:none;border-radius:6px;display:inline-block;">
          Ver noticias de GOTS
        </a>
      </p>
      <h3>Resumen</h3>
      <ul>
        {items_html}
      </ul>
    </body>
  </html>
  """.strip()

  msg = EmailMessage()
  msg["Subject"] = subject
  msg["From"] = f"{from_name} <{smtp_user}>"
  msg.set_content(
    "Noticias semanales GOTS.\n"
    f"Revisa las noticias aquí: {site_url}\n"
    "Incluye seminarios y novedades del grupo."
  )
  msg.add_alternative(html, subtype="html")

  print("=== PREVIEW ===")
  print(f"Mode: {send_mode}")
  print(f"Subject: {subject}")
  print(f"News URL: {site_url}")
  print(f"Recipients detected: {len(recipients)}")
  if send_mode == "preview":
    print("Preview mode: no email sent.")
    return

  if send_mode == "test":
    if not test_recipient:
      raise RuntimeError("TEST_RECIPIENT is required in test mode.")
    msg["To"] = test_recipient
    print(f"Test mode: sending only to {test_recipient}")
  else:
    msg["To"] = smtp_user
    msg["Bcc"] = ", ".join(recipients)
    print("Send mode: sending to full recipients list (BCC).")

  with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login(smtp_user, smtp_pass)
    server.send_message(msg)

  if send_mode == "test":
    print("Test email sent.")
  else:
    print(f"Email sent to {len(recipients)} recipients.")


if __name__ == "__main__":
  send_email()
