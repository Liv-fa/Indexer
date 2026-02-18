Commonly Used Websites
======================

How to run locally (double-click / file://)

- You can open `index.html` directly in a browser by double-clicking it. Because this is served via `file://`, the service worker will not run (this is by design). The site will still work: settings, toasts, and the health indicator will detect "local" mode.

How to run with a local server (recommended for full functionality)

```bash
cd "./indexer/website"
python3 server.py
# then open http://localhost:8000
```

This custom server ensures `websites.csv` is never cached, allowing dynamic updates.

How to stop the server

To stop the local server, press `Ctrl+C` in the terminal where the server is running. If it's running in the background, you can kill it with:

```bash
ps aux | grep "server.py" | grep -v grep | awk '{print $2}' | xargs kill
```

Notes
- Service worker and offline caching require HTTP/HTTPS (or localhost).
- When opened via `file://`, the page sets the status to "local" and skips live health checks.
