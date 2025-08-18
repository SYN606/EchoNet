#!/bin/bash

# ===== Colors =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
BLACK='\033[0;30m'
NC='\033[0m'

# ===== Utility Functions =====
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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
        PKGS=(python python-pip curl)
    else
        log_error "Unsupported package manager. Only apt-get and pacman are supported."
        exit 1
    fi
    log_info "Using package manager: $PKG_MANAGER"
}

# ===== Package Installation =====
install_missing_packages() {
    MISSING_PKGS=()
    for pkg in "${PKGS[@]}"; do
        if ! command -v "${pkg%%:*}" &>/dev/null; then
            MISSING_PKGS+=("$pkg")
        fi
    done

    if [ ${#MISSING_PKGS[@]} -ne 0 ]; then
        log_warn "Missing packages detected: ${MISSING_PKGS[*]}"
        $UPDATE_CMD
        $INSTALL_CMD "${MISSING_PKGS[@]}"
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
        log_warn "Virtual environment not found. Creating one..."
        python3 -m venv env || python -m venv env
    fi
    log_info "Activating virtual environment..."
    source env/bin/activate
    log_info "Upgrading pip, setuptools, wheel..."
    pip install --upgrade pip setuptools wheel
}

# ===== Dependencies =====
install_dependencies() {
    if [ -f "requirements.txt" ]; then
        log_info "Installing Python dependencies..."
        pip install -r requirements.txt
    fi
    log_info "Ensuring Gunicorn is installed..."
    pip install --upgrade gunicorn
}

# ===== Run Server =====
run_server() {
    log_info "Starting Gunicorn server at http://0.0.0.0:8000"
    exec gunicorn -w 4 -b 0.0.0.0:8000 app:app
}

# ===== Main Execution =====
main() {
    clear
    show_banner
    log_info "Setting up project in 'source' directory..."
    WORKING_DIR="source"
    cd "$WORKING_DIR"

    detect_package_manager
    install_missing_packages
    check_internet
    setup_virtualenv
    install_dependencies
    run_server
}

main "$@"
