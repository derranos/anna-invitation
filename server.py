from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json


ROOT = Path(__file__).resolve().parent


class SiteHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/answer.txt":
            self.send_error(404)
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/save":
            self.send_error(404)
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            event = str(data.get("event", "")).strip()
            date = str(data.get("date", "")).strip()
            time = str(data.get("time", "")).strip()
            datetime.strptime(date, "%Y-%m-%d")
            datetime.strptime(time, "%H:%M")
            if not event or len(event) > 80:
                raise ValueError
        except (ValueError, TypeError, json.JSONDecodeError):
            self.respond(422, {"ok": False, "error": "Invalid data"})
            return

        record = {
            "received_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "event": event,
            "date": date,
            "time": time,
        }
        try:
            with (ROOT / "answer.txt").open("a", encoding="utf-8") as answer_file:
                answer_file.write(json.dumps(record, ensure_ascii=False) + "\n")
        except OSError:
            self.respond(500, {"ok": False, "error": "Cannot write answer.txt"})
            return

        self.respond(200, {"ok": True})

    def respond(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    import os

    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", 8080), SiteHandler)
    print("Сайт запущен: http://localhost:8080")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСервер остановлен")
    finally:
        server.server_close()
