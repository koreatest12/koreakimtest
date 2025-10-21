# Red Hat UBI base image with updates, directory creation, and permissions file
# Requires subscription for full RHEL; UBI is freely redistributable
FROM registry.access.redhat.com/ubi9/ubi:latest

# Use dnf for package management on UBI9
RUN set -eux \
    && dnf -y update \
    && dnf -y clean all \
    # Create directories
    && mkdir -p /opt/app/data /var/log/app /etc/app \
    # Create a sample permission file
    && printf "%s\n" "role=admin" "access=read,write,execute" > /etc/app/permissions.conf \
    # Set permissions
    && chown root:root /etc/app/permissions.conf \
    && chmod 0644 /etc/app/permissions.conf \
    && chown -R root:root /opt/app /var/log/app /etc/app \
    && chmod -R 0755 /opt/app /var/log/app /etc/app

# Default command
CMD ["bash", "-lc", "echo UBI image ready; ls -l /etc/app && ls -l /opt/app /var/log/app"]
