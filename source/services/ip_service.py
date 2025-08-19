import requests

def get_ip_details(ip: str) -> dict:

    try:
        url = f"https://ipinfo.io/{ip}"

        resp = requests.get(url, timeout=5)
        resp.raise_for_status()

        data = resp.json()
        return {
            "ip": ip,
            "hostname": data.get("hostname"),
            "city": data.get("city"),
            "region": data.get("region"),
            "country": data.get("country"),
            "loc": data.get("loc"),
            "org": data.get("org"),
            "postal": data.get("postal"),
            "timezone": data.get("timezone")
        }
    except Exception as e:
        return {"ip": ip, "error": str(e)}
