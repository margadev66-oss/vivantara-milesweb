import paramiko
import sys

def check_ssh(host, user, password, port):
    print(f"Checking {host}:{port}...")
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(host, port=port, username=user, password=password, timeout=5)
        print(f"Connected successfully on port {port}")
        stdin, stdout, stderr = client.exec_command("ls -F ~")
        print("Home Directory Listing:")
        print(stdout.read().decode())
        client.close()
        return True
    except Exception as e:
        print(f"Failed on port {port}: {e}")
        return False

host = "vivantara.com"
user = "aumlan"
password = "shikhaghosh003"

ports = [22, 21098, 2222]
for port in ports:
    if check_ssh(host, user, password, port):
        break
