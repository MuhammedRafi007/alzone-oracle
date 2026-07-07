# Run Manual for Hosting (Oracle Network Application)

This guide explains how to run your Alzone Oracle application and allow other people on your local network (Wi-Fi or LAN) to access it.

## 1. Starting the Application
Open your terminal in the `Oracle` project folder (`c:\Alzone\Research\Oracle`) and run:

```bash
npm run dev:all
```
*This command starts both your Vite frontend and your Express SQLite backend server simultaneously.*

## 2. Sharing Access
To access the application, the other person must be connected to the **same Wi-Fi network** as you.

Ask them to open their web browser and navigate to your exact local IP address on port 5173:

**http://192.168.75.224:5173**

*(Note: Your current Wi-Fi IP address is `192.168.75.224` as of right now. If your router assigns you a new IP address in the future, you will need to find the new IP address by running `ipconfig` in the Windows command prompt).*

## 3. Troubleshooting
If the other person on the network gets a **"Site cannot be reached"** error:
1. Open your **Windows Start menu** and type **Windows Defender Firewall**.
2. Click on **Allow an app or feature through Windows Defender Firewall**.
3. Click **Change settings** (you may need administrator privileges).
4. Find **Node.js** (or Evented I/O for V8 JavaScript) in the list.
5. Ensure both the **Private** and **Public** checkboxes are ticked.
6. Click **OK** and have the other person try the link again.
