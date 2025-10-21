# Ubuntu base image with upgrades, directory creation, and permissions file
FROM ubuntu:24.04

# Set noninteractive for apt
ENV DEBIAN_FRONTEND=noninteractive

# Create directories (example paths) and perform upgrade
# Also create a permissions file and set ownership/permissions
RUN set -eux \
    && apt-get update \
    && apt-get -y dist-upgrade \
    && rm -rf /var/lib/apt/lists/* \
    # Recreate lists after cleanup for next installs
    && apt-get update \
    # Create directories
    && mkdir -p /opt/app/data /var/log/app /etc/app \
    # Create a sample permission file
    && echo "role=admin" > /etc/app/permissions.conf \
    && echo "access=read,write,execute" >> /etc/app/permissions.conf \
    # Set permissions: owner root, readable by all
    && chown root:root /etc/app/permissions.conf \
    && chmod 0644 /etc/app/permissions.conf \
    # Ensure directories have sensible permissions
    && chown -R root:root /opt/app /var/log/app /etc/app \
    && chmod -R 0755 /opt/app /var/log/app /etc/app

# Provide a default command
CMD ["bash", "-lc", "echo Ubuntu image ready; ls -l /etc/app && ls -l /opt/app /var/log/app"]
