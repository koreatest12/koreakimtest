Scripts:
- install_linux_dependencies.sh: Install Java 17 and Docker (apt/dnf/yum).
- docker_build.sh [image]: Build container image (default: defenderbot:latest).
- docker_run.sh [image] [container]: Run container exposing 8080.
- docker_save.sh [image] [outfile]: Save Docker image to tar.
- docker_load.sh [tarfile]: Load Docker image from tar.
- service_install.sh [jar]: Install systemd service using built jar (default: target/defenderbot.jar).
