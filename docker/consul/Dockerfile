FROM hashicorp/consul:1.21.0
COPY ./consul-kv-docker.json /usr/src/consul/
WORKDIR /usr/src/consul
ENV CONSUL_HTTP_ADDR=consul:8500
ENTRYPOINT ["/bin/sh", "-c", "until consul kv import @consul-kv-docker.json; do echo 'Waiting for Consul'; sleep 2; done"]
