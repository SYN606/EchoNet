from flask import Flask
from routes.main import main_bp
from routes.logging import logging_bp


def create_app():
    app = Flask(__name__)

    # Register Blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(logging_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
