# Troubleshooting Sui CLI File Lock Error

## Error: "The process cannot access the file because another process has locked a portion of the file"

This is a Windows-specific file locking issue with the Sui CLI config file.

## Solutions (try in order)

### Solution 1: Close Other Sui Processes

1. Open Task Manager (Ctrl + Shift + Esc)
2. Look for any `sui` processes
3. End all Sui-related processes
4. Try the command again

### Solution 2: Run as Administrator

1. Close your current terminal
2. Right-click PowerShell/Command Prompt
3. Select "Run as Administrator"
4. Navigate back to your project:
   ```powershell
   cd "D:\User\Von\Documents\Codes\Sui PRojects\YGG-project\sui"
   ```
5. Try the publish command again:
   ```bash
   sui client publish --gas-budget 10000000
   ```

### Solution 3: Manually Create Config Directory

1. Create the config directory manually:
   ```powershell
   mkdir C:\Users\Von\.sui\sui_config -Force
   ```

2. Try the publish command again

### Solution 4: Use Environment Variable for Config Path

Set a custom config path:

```powershell
$env:SUI_CONFIG_PATH="D:\User\Von\Documents\Codes\Sui PRojects\YGG-project\.sui-config"
sui client publish --gas-budget 10000000
```

### Solution 5: Delete and Recreate Config (if it exists)

If the config file already exists but is corrupted:

```powershell
# Close all terminals first
# Then in a new terminal:
Remove-Item C:\Users\Von\.sui\sui_config\client.yaml -Force -ErrorAction SilentlyContinue
sui client publish --gas-budget 10000000
```

### Solution 6: Initialize Client Separately

Try initializing the client first, then publishing:

```bash
# Initialize client (this will create the config)
sui client

# Then try publishing
sui client publish --gas-budget 10000000
```

### Solution 7: Check File Permissions

1. Navigate to: `C:\Users\Von\.sui\sui_config\`
2. Right-click `client.yaml` (if it exists)
3. Properties → Security
4. Make sure your user has Full Control
5. Apply changes

### Solution 8: Use WSL (Windows Subsystem for Linux)

If you have WSL installed, you can use it to avoid Windows file locking issues:

```bash
wsl
cd /mnt/d/User/Von/Documents/Codes/Sui\ PRojects/YGG-project/sui
sui client publish --gas-budget 10000000
```

## ✅ BEST SOLUTION: Use Custom Config Path (Recommended)

**This is the most reliable workaround for Windows file locking issues.**

I've created helper scripts in the `sui/` directory:

### Option 1: Use the PowerShell Script (Recommended)

```powershell
cd sui
.\publish.ps1
```

### Option 2: Use the Batch Script

```cmd
cd sui
publish.bat
```

### Option 3: Manual Custom Config Path

Set the environment variable and run:

```powershell
cd sui
$env:SUI_CONFIG_PATH="D:\User\Von\Documents\Codes\Sui PRojects\YGG-project\.sui-config"
sui client publish --gas-budget 10000000
```

Or in one line:
```bash
cd sui
$env:SUI_CONFIG_PATH="$PWD\.sui-config"; sui client publish --gas-budget 10000000
```

This creates the config in your project directory instead of the user directory, avoiding Windows file locking issues entirely.

## Alternative Solutions

### Solution 1: Run as Administrator

1. Close all terminals
2. Right-click PowerShell → "Run as Administrator"
3. Navigate to your project and try again

### Solution 2: Manual Config Cleanup

```powershell
# Remove locked config file
Remove-Item "C:\Users\Von\.sui\sui_config\client.yaml" -Force -ErrorAction SilentlyContinue

# Try again
cd sui
sui client publish --gas-budget 10000000
```

