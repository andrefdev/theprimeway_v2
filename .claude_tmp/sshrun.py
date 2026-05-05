#!/usr/bin/env python3
"""Run a command on the remote server via SSH and print stdout+stderr.

Usage: python sshrun.py "<command>"
"""
import sys
import io
import paramiko

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

HOST = "46.62.165.137"
USER = "deploy"
PASS = "v2Auh5Es5*$K&qJNl"

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "whoami && hostname"
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=15, banner_timeout=15, auth_timeout=15)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    rc = stdout.channel.recv_exit_status()
    if out:
        sys.stdout.write(out)
    if err:
        sys.stderr.write("--- STDERR ---\n" + err)
    client.close()
    sys.exit(rc)

if __name__ == "__main__":
    main()
