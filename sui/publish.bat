@echo off
REM Sui Contract Publishing Script (Batch version)
REM This uses a custom config path to avoid Windows file locking issues

setlocal

set "CUSTOM_CONFIG_PATH=%~dp0.sui-config"
set "SUI_CONFIG_PATH=%CUSTOM_CONFIG_PATH%"

echo Using custom config path: %CUSTOM_CONFIG_PATH%

REM Create config directory if it doesn't exist
if not exist "%CUSTOM_CONFIG_PATH%" (
    mkdir "%CUSTOM_CONFIG_PATH%"
    echo Created config directory
)

REM Navigate to sui directory
cd /d "%~dp0"

REM Build the contract
echo.
echo Building contract...
sui move build

if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

REM Publish the contract
echo.
echo Publishing contract...
sui client publish --gas-budget 10000000

if errorlevel 1 (
    echo.
    echo Publishing failed!
    exit /b 1
) else (
    echo.
    echo Contract published successfully!
    echo.
    echo Copy the 'Published object ID' from above and add it to your .env file as:
    echo VITE_SUI_PACKAGE_ID=0x...
)

endlocal

