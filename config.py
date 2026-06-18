import os
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask


# Load environment variables from a local .env file during development.
# In production, environment variables should be provided by the host/platform.
load_dotenv()


class Config:
    """Base Flask configuration with secure defaults."""

    # Required secret key for sessions, CSRF protection, signing cookies, etc.
    # Set this in your environment:
    # SECRET_KEY="a-long-random-secret-value"
    SECRET_KEY = os.environ.get("SECRET_KEY")

    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY environment variable is required")

    # Prevent accidental debug mode in production.
    DEBUG = False
    TESTING = False

    # Secure session cookie settings.
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"

    # Optional: rename the session cookie to avoid the default Flask name.
    SESSION_COOKIE_NAME = "__Host-session"

    # Limit session lifetime.
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)

    # Protect against oversized request payloads.
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

    # Prefer HTTPS URLs when Flask builds external links.
    PREFERRED_URL_SCHEME = "https"

    # Disable JSON key sorting to avoid unnecessary response mutation.
    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    """Development-only configuration."""

    DEBUG = True

    # Local development usually runs over HTTP.
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # Ensure cookies are only sent over HTTPS.
    SESSION_COOKIE_SECURE = True

    # Keep cookies inaccessible to JavaScript.
    SESSION_COOKIE_HTTPONLY = True

    # Helps reduce CSRF risk while preserving common login/session flows.
    SESSION_COOKIE_SAMESITE = "Lax"

    # If your app is behind a reverse proxy, configure the proxy correctly
    # and apply ProxyFix in your application factory if needed.


class TestingConfig(Config):
    """Testing configuration."""

    TESTING = True
    DEBUG = False

    # Tests often run without HTTPS.
    SESSION_COOKIE_SECURE = False

    # Use a predictable test secret only in test environments.
    SECRET_KEY = os.environ.get("TEST_SECRET_KEY", "test-only-secret-key")


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def create_app() -> Flask:
    """Create and configure the Flask application."""

    app = Flask(__name__)

    env_name = os.environ.get("FLASK_ENV", "production").lower()
    config_class = config_by_name.get(env_name, ProductionConfig)

    app.config.from_object(config_class)

    @app.after_request
    def add_security_headers(response):
        """Add basic production-ready HTTP security headers."""

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )

        if not app.config["DEBUG"]:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )

        return response

    return app