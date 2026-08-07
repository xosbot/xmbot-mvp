from starlette.requests import Request

from src.api.user_auth import ANONYMOUS, sign_user_id, verified_user_id


def make_request(headers: dict[str, str]) -> Request:
    scope = {
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


SECRET = "shared-secret"


class TestSignUserId:
    def test_deterministic(self):
        assert sign_user_id("user-1", SECRET) == sign_user_id("user-1", SECRET)

    def test_different_users_different_signatures(self):
        assert sign_user_id("user-1", SECRET) != sign_user_id("user-2", SECRET)

    def test_different_secrets_different_signatures(self):
        assert sign_user_id("user-1", SECRET) != sign_user_id("user-1", "other-secret")


class TestVerifiedUserId:
    def test_valid_signature_returns_user_id(self):
        request = make_request(
            {"X-User-Id": "user-1", "X-User-Signature": sign_user_id("user-1", SECRET)}
        )
        assert verified_user_id(request, SECRET) == "user-1"

    def test_missing_signature_falls_back_to_anonymous(self):
        request = make_request({"X-User-Id": "user-1"})
        assert verified_user_id(request, SECRET) == ANONYMOUS

    def test_tampered_user_id_falls_back_to_anonymous(self):
        # Attacker signs their own id, then swaps in a victim's id.
        forged_signature = sign_user_id("attacker", SECRET)
        request = make_request({"X-User-Id": "victim", "X-User-Signature": forged_signature})
        assert verified_user_id(request, SECRET) == ANONYMOUS

    def test_wrong_secret_falls_back_to_anonymous(self):
        request = make_request(
            {"X-User-Id": "user-1", "X-User-Signature": sign_user_id("user-1", "wrong-secret")}
        )
        assert verified_user_id(request, SECRET) == ANONYMOUS

    def test_no_headers_returns_anonymous(self):
        request = make_request({})
        assert verified_user_id(request, SECRET) == ANONYMOUS

    def test_empty_server_secret_returns_anonymous(self):
        request = make_request(
            {"X-User-Id": "user-1", "X-User-Signature": sign_user_id("user-1", SECRET)}
        )
        assert verified_user_id(request, "") == ANONYMOUS
