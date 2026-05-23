use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

pub async fn start_oauth_server(port: u16) -> Result<String, String> {
    let listener = TcpListener::bind(SocketAddr::from(([127, 0, 0, 1], port)))
        .await
        .map_err(|e| e.to_string())?;

    tokio::time::timeout(tokio::time::Duration::from_secs(120), async {
        loop {
            let Ok((mut stream, _)) = listener.accept().await else { continue };

            let mut buf = vec![0u8; 4096];
            let Ok(n) = stream.read(&mut buf).await else { continue };

            let request = String::from_utf8_lossy(&buf[..n]);

            if let Some(code) = extract_code(&request) {
                let _ = stream.write_all(
                    b"HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n\
                    <html><body style='background:#0e0e0f;color:white;font-family:sans-serif;\
                    display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>\
                    <div style='text-align:center'><h2>Connected!</h2>\
                    <p>You can close this tab and return to Lyric Player.</p>\
                    </div></body></html>",
                ).await;
                let _ = stream.flush().await;
                return Ok(code);
            }

            let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\n\r\n").await;
        }
    })
    .await
    .map_err(|_| "OAuth timeout".to_string())?
}

fn extract_code(request: &str) -> Option<String> {
    let line = request.lines().next()?;
    if !line.contains("/callback") { return None; }

    let query = &line[line.find('?')? + 1..line.rfind(" HTTP")?];

    query.split('&')
        .find_map(|pair| {
            let (k, v) = pair.split_once('=')?;
            (k == "code").then(|| v.to_string())
        })
}
