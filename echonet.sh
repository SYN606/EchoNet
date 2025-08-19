#!/bin/bash

# ===== Colors =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

# ===== Utility Functions =====
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error(){ echo -e "${RED}[ERROR]${NC} $1"; }

# ===== Banner =====
show_banner() {
    echo -e "${WHITE}"
    echo "============================================================"
    echo -e "${GREEN}     ▄▄▄ . ▄▄·  ▄ .▄       ▐ ▄ ▄▄▄ .▄▄▄▄▄${NC}"
    echo -e "${GREEN}     ▀▄.▀·▐█ ▌▪██▪▐█ ▄█▀▄ •█▌▐█▀▄.▀·•██  ${NC}"
    echo -e "${GREEN}     ▐▀▀▪▄██ ▄▄██▀▀█▐█▌.▐▌▐█▐▐▌▐▀▀▪▄ ▐█.▪${NC}"
    echo -e "${GREEN}     ▐█▄▄▌▐███▌██▌▐▀▐█▌.▐▌██▐█▌▐█▄▄▌ ▐█▌·${NC}"
    echo -e "${GREEN}      ▀▀▀ ·▀▀▀ ▀▀▀ · ▀█▄▀▪▀▀ █▪ ▀▀▀  ▀▀▀ ${NC}"
    echo "============================================================"
    echo -e "${WHITE}   Developed by:${NC} ${GREEN}SYN606${NC}"
    echo -e "${WHITE}   GitHub:${NC}      ${YELLOW}https://github.com/syn606${NC}"
    echo -e "${WHITE}   Portfolio:${NC}   ${YELLOW}https://syn606.pages.dev${NC}"
    echo "============================================================"
    echo ""
}

# ===== Package Manager Detection =====
detect_package_manager() {
    if command -v apt-get &>/dev/null; then
        PKG_MANAGER="apt-get"
        INSTALL_CMD="sudo apt-get install -y"
        UPDATE_CMD="sudo apt-get update"
        PKGS=(python3 python3-venv python3-pip curl)
    elif command -v pacman &>/dev/null; then
        PKG_MANAGER="pacman"
        INSTALL_CMD="sudo pacman -S --noconfirm --needed"
        UPDATE_CMD="sudo pacman -Sy"
        PKGS=(python curl)
    else
        log_error "Unsupported package manager. Only apt-get and pacman are supported."
        exit 1
    fi
    log_info "Using package manager: $PKG_MANAGER"
}

install_missing_packages() {
    MISSING_PKGS=()
    if [ "$PKG_MANAGER" = "apt-get" ]; then
        for pkg in "${PKGS[@]}"; do
            if ! dpkg -s "$pkg" >/dev/null 2>&1; then
                MISSING_PKGS+=("$pkg")
            fi
        done
    else # pacman
        for pkg in "${PKGS[@]}"; do
            if ! pacman -Qi "$pkg" >/dev/null 2>&1; then
                MISSING_PKGS+=("$pkg")
            fi
        done
    fi

    if [ ${#MISSING_PKGS[@]} -ne 0 ]; then
        log_warn "Missing packages detected: ${MISSING_PKGS[*]}"
        log_info "Installing required packages..."
        $UPDATE_CMD >install.log 2>&1
        $INSTALL_CMD "${MISSING_PKGS[@]}" >>install.log 2>&1
    else
        log_info "All required system packages are installed."
    fi
}

# ===== Internet Check =====
check_internet() {
    log_info "Checking internet connection..."
    if ! curl -s --head https://www.google.com | head -n 1 | grep -q "200\|301"; then
        log_error "No internet connection. Please check your network."
        exit 1
    fi
    log_info "Internet connection is active."
}

# ===== Virtual Environment =====
setup_virtualenv() {
    if [ ! -d "env" ]; then
        log_info "No virtual environment found. Creating one..."
        python3 -m venv env || python -m venv env
        source env/bin/activate
        log_info "Upgrading pip, setuptools, wheel..."
        python -m pip install -q --upgrade pip setuptools wheel
        install_dependencies 
    else
        log_info "Virtual environment already exists. Activating..."
        source env/bin/activate
    fi
}

# ===== Dependencies =====
install_dependencies() {
    if [ -f "requirements.txt" ]; then
        log_info "Checking Python dependencies against requirements.txt..."
        python - <<'PY'
import sys, pkg_resources, pathlib
req = pathlib.Path("requirements.txt")
lines = [l.strip() for l in req.read_text().splitlines()
         if l.strip() and not l.strip().startswith('#') and not l.strip().startswith('-r ')]
try:
    pkg_resources.require(lines)
    sys.exit(0)
except Exception:
    sys.exit(1)
PY
        NEED_REQS=$?
        if [ $NEED_REQS -ne 0 ]; then
            log_info "Installing/upgrading required Python packages..."
            python -m pip install -q -r requirements.txt
        else
            log_info "All requirements are already satisfied."
        fi
    fi

    if python -c "import gunicorn" >/dev/null 2>&1; then
        log_info "Gunicorn already installed."
    else
        log_info "Installing Gunicorn..."
        python -m pip install -q gunicorn
    fi
}

# ===== Cloudflared Installation =====
install_cloudflared() {
    if command -v cloudflared &>/dev/null; then
        log_info "Cloudflared is already installed."
        return
    fi

    if [ "$PKG_MANAGER" = "apt-get" ]; then
        log_info "Installing Cloudflared (APT repo)..."
        sudo mkdir -p --mode=0755 /usr/share/keyrings
        curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
        echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | \
            sudo tee /etc/apt/sources.list.d/cloudflared.list >/dev/null
        sudo apt-get update >>install.log 2>&1
        sudo apt-get install -y cloudflared >>install.log 2>&1
        log_info "Cloudflared installed successfully."
    else
        log_info "Installing Cloudflared (Arch AUR)..."
        if command -v yay &>/dev/null; then
            yay -S --noconfirm cloudflared >>install.log 2>&1
        elif command -v paru &>/dev/null; then
            paru -S --noconfirm cloudflared >>install.log 2>&1
        else
            log_error "No AUR helper (yay/paru) found. Install Cloudflared manually."
        fi
    fi
}

# ===== Run Server =====
run_server() {
    log_info "Starting Gunicorn server at http://0.0.0.0:8000"
    gunicorn -w 4 -b 0.0.0.0:8000 app:app >>gunicorn.log 2>&1 &
    GUNICORN_PID=$!
}

# ===== Cloudflared Tunnel =====
start_cloudflared_tunnel() {
    if ! command -v cloudflared &>/dev/null; then
        log_error "Cloudflared is not installed. Cannot start tunnel."
        return 1
    fi

    log_info "Starting Cloudflared tunnel..."
    cloudflared tunnel --url http://0.0.0.0:8000 --no-autoupdate >cloudflared.log 2>&1 &
    CLOUDFLARED_PID=$!

    # Wait up to 30s for the URL to appear
    for _ in {1..30}; do
        TUNNEL_URL=$(grep -Eo "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" cloudflared.log | head -n 1)
        if [ -n "$TUNNEL_URL" ]; then
            export ECHONET_TUNNEL_URL="$TUNNEL_URL"
            log_info "Tunnel established: ${YELLOW}$TUNNEL_URL${NC}"
            log_info "You can access it with: ${GREEN}$ECHONET_TUNNEL_URL${NC}"
            return 0
        fi
        sleep 1
    done

    log_error "Failed to detect tunnel URL after 30s. Check cloudflared.log"
    tail -n 20 cloudflared.log
}

# ===== Cleanup =====
cleanup() {
    echo ""
    log_warn "Shutting down..."
    [ -n "$CLOUDFLARED_PID" ] && kill "$CLOUDFLARED_PID" 2>/dev/null
    [ -n "$GUNICORN_PID" ] && kill "$GUNICORN_PID" 2>/dev/null
    log_info "Processes stopped."

    log_info "Cleaning up log files..."
    rm -f install.log pip.log cloudflared.log gunicorn.log
    find . -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null

    echo ""
    echo -e "${WHITE}Thanks for using ${YELLOW}Echonet${NC} ${WHITE}(developed by${NC} ${GREEN}SYN606${NC}${WHITE})${NC}"
    echo ""
    exit 0
}
trap cleanup SIGINT SIGTERM

# ===== Main Execution =====
main() {
    clear
    show_banner
    log_info "Setting up project in 'source' directory..."
    WORKING_DIR="source"
    if [ ! -d "$WORKING_DIR" ]; then
        log_error "Directory '$WORKING_DIR' not found."
        exit 1
    fi
    cd "$WORKING_DIR"

    detect_package_manager
    install_missing_packages
    check_internet
    setup_virtualenv
    install_cloudflared
    run_server
    sleep 3
    start_cloudflared_tunnel
    wait
}
main "$@"
