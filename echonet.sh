#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' 

clear
echo -e "${MAGENTA}"
echo "============================================================"
echo -e "${CYAN}     ▄▄▄ . ▄▄·  ▄ .▄       ▐ ▄ ▄▄▄ .▄▄▄▄▄${NC}"
echo -e "${CYAN}     ▀▄.▀·▐█ ▌▪██▪▐█ ▄█▀▄ •█▌▐█▀▄.▀·•██  ${NC}"
echo -e "${CYAN}     ▐▀▀▪▄██ ▄▄██▀▀█▐█▌.▐▌▐█▐▐▌▐▀▀▪▄ ▐█.▪${NC}"
echo -e "${CYAN}     ▐█▄▄▌▐███▌██▌▐▀▐█▌.▐▌██▐█▌▐█▄▄▌ ▐█▌·${NC}"
echo -e "${CYAN}      ▀▀▀ ·▀▀▀ ▀▀▀ · ▀█▄▀▪▀▀ █▪ ▀▀▀  ▀▀▀ ${NC}"

echo "============================================================"
echo -e "${GREEN}   Developed by: SYN606 ${NC}"
echo -e "${YELLOW}   GitHub:   ${WHITE}https://github.com/syn606${NC}"
echo -e "${YELLOW}   Portfolio:${WHITE} https://syn606.pages.dev${NC}"
echo -e "${MAGENTA}============================================================${NC}"
echo ""

# 🚀 Setup & Run

WORKING_DIR=source
cd "$WORKING_DIR"

echo -e "${CYAN}🚀 Setting up project in ${WORKING_DIR}...${NC}"

# 🌐 Check Internet
echo -e "${BLUE}🌐 Checking internet connection...${NC}"
if ! ping -c 1 -q google.com &>/dev/null; then
    echo -e "${RED}❌ No internet connection. Please check your network.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Internet connection is active.${NC}"

# 🔧 Virtual Environment
if [ ! -d "env" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv env
fi

echo -e "${BLUE}🔑 Activating virtual environment...${NC}"
source env/bin/activate

echo -e "${BLUE}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip

# 📚 Dependencies
if [ -f "requirements.txt" ]; then
    echo -e "${BLUE}📚 Installing dependencies...${NC}"
    pip install -r requirements.txt
fi

echo -e "${YELLOW}⚙️  Ensuring Gunicorn is installed...${NC}"
pip install gunicorn

# 🚀 Run Server
echo -e "${GREEN}🎉 Starting Gunicorn server at ${YELLOW}http://0.0.0.0:8000${NC}"
exec gunicorn -w 4 -b 0.0.0.0:8000 app:app