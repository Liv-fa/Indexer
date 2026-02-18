#!/usr/bin/env python3
import http.server
import socketserver

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add no-cache for websites.csv
        if self.path.endswith('websites.csv'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress logs
        pass

if __name__ == '__main__':
    PORT = 8000
    # Already in the correct directory
    with socketserver.TCPServer(("", PORT), NoCacheHTTPRequestHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f"Serving on port {PORT}")
        httpd.serve_forever()