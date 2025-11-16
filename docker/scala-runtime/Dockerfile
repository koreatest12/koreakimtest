# Custom Scala + SBT runtime image used by Dependabot workflows
FROM eclipse-temurin:17-jdk

LABEL org.opencontainers.image.title="Scala runtime"
LABEL org.opencontainers.image.description="Custom Scala/SBT runtime built from upstream tarballs"
LABEL maintainer="Dependabot Provisioning Workflow"

ENV SCALA_VERSION=2.13.14 \
    SBT_VERSION=1.10.2 \
    SCALA_HOME=/opt/scala \
    SBT_HOME=/opt/sbt \
    PATH="${SCALA_HOME}/bin:${SBT_HOME}/bin:${PATH}"

# Install curl and download Scala/SBT archives directly from the upstream distribution
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      gnupg \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /tmp/downloads \
    && curl -fsSL "https://downloads.lightbend.com/scala/${SCALA_VERSION}/scala-${SCALA_VERSION}.tgz" -o /tmp/downloads/scala.tgz \
    && tar -xzf /tmp/downloads/scala.tgz -C /opt \
    && mv /opt/scala-${SCALA_VERSION} ${SCALA_HOME} \
    && curl -fsSL "https://github.com/sbt/sbt/releases/download/v${SBT_VERSION}/sbt-${SBT_VERSION}.tgz" -o /tmp/downloads/sbt.tgz \
    && tar -xzf /tmp/downloads/sbt.tgz -C /opt \
    && mv /opt/sbt /opt/sbt-${SBT_VERSION} \
    && ln -s /opt/sbt-${SBT_VERSION} ${SBT_HOME} \
    && rm -rf /tmp/downloads

WORKDIR /workspace

RUN scala -version && sbt sbtVersion

CMD ["/bin/bash"]
