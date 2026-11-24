"""Org CA bundle (values.yaml `orgCABundle`) render tests."""

VOLUME = "org-ca-bundle"
CERT_FILE = "/etc/ssl/certs/org-ca.crt"


class TestDisabledByDefault:
    """An unset configMapName must not mount anything."""

    def test_no_volume_or_mount(self, render):
        manifests = render()
        assert manifests.volume(VOLUME) is None
        assert manifests.volume_mount(VOLUME) is None

    def test_no_cert_file_env_var(self, render):
        assert render().env("SSL_CERT_FILE") is None


class TestEnabled:
    def test_default_key(self, render):
        manifests = render({"orgCABundle.configMapName": "org-ca-bundle"})
        volume = manifests.volume(VOLUME)
        assert volume["configMap"]["name"] == "org-ca-bundle"
        assert volume["configMap"]["items"] == [{"key": "ca-bundle.crt", "path": "org-ca.crt"}]
        assert manifests.volume_mount(VOLUME)["mountPath"] == CERT_FILE
        assert manifests.env("SSL_CERT_FILE") == CERT_FILE

    def test_custom_key(self, render):
        manifests = render(
            {
                "orgCABundle.configMapName": "nebari-trust-bundle",
                "orgCABundle.key": "ca-certificates.crt",
            }
        )
        volume = manifests.volume(VOLUME)
        assert volume["configMap"]["name"] == "nebari-trust-bundle"
        assert volume["configMap"]["items"] == [{"key": "ca-certificates.crt", "path": "org-ca.crt"}]
        assert manifests.env("SSL_CERT_FILE") == CERT_FILE
