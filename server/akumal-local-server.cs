using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;

internal static class AkumalLocalServer
{
    private static void Main()
    {
        string htmlPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "site", "index.html");
        TcpListener listener = new TcpListener(IPAddress.Loopback, 8765);
        listener.Start();
        Console.WriteLine("Serving http://127.0.0.1:8765/");
        while (true)
        {
            using (TcpClient client = listener.AcceptTcpClient())
            {
                try
                {
                    NetworkStream stream = client.GetStream();
                    StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true);
                    string request = reader.ReadLine() ?? "";
                    string line;
                    while ((line = reader.ReadLine()) != null && line.Length != 0) { }

                    bool found = request.StartsWith("GET / ") ||
                                 request.StartsWith("GET /?") ||
                                 request.StartsWith("GET /preview ") ||
                                 request.StartsWith("GET /index.html ");
                    byte[] body = found ? File.ReadAllBytes(htmlPath) : Encoding.UTF8.GetBytes("Not found");
                    string status = found ? "200 OK" : "404 Not Found";
                    string contentType = found ? "text/html; charset=utf-8" : "text/plain; charset=utf-8";
                    string headers = "HTTP/1.1 " + status + "\r\n" +
                                     "Content-Type: " + contentType + "\r\n" +
                                     "Content-Length: " + body.Length + "\r\n" +
                                     "Cache-Control: no-store\r\n" +
                                     "Connection: close\r\n\r\n";
                    byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
                    stream.Write(headerBytes, 0, headerBytes.Length);
                    stream.Write(body, 0, body.Length);
                    stream.Flush();
                }
                catch (IOException) { }
                catch (SocketException) { }
            }
        }
    }
}
