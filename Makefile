#DOCKER
docker-up:
	docker compose up -d --build
docker-down:
	docker compose down --remove-orphans
docker-down-clear:
	docker compose down -v --remove-orphans
prod-docker-build:
	REGISTRY=cr.selcloud.ru/{registry_name} IMAGE_TAG=master-1 make docker-build push
dev-docker-build:
	REGISTRY=local IMAGE_TAG=master-1 make docker-build
dev-run-build:
	REGISTRY=local IMAGE_TAG=master-1 docker compose -f docker-compose.yml up -d

docker-build: docker-build-backend docker-build-nginx docker-build-react docker-build-db

docker-build-backend:
	DOCKER_BUILDKIT=1 docker --log-level=debug build --pull --build-arg BUILDKIT_INLINE_CACHE=1 \
    	--tag ${REGISTRY}/backend:${IMAGE_TAG} \
    	--file ./docker/Django/Dockerfile .
docker-build-nginx:
	DOCKER_BUILDKIT=1 docker --log-level=debug build --pull --build-arg BUILDKIT_INLINE_CACHE=1 \
    	--tag ${REGISTRY}/nginx:${IMAGE_TAG} \
    	--file ./docker/Nginx/Dockerfile .
docker-build-react:
	DOCKER_BUILDKIT=1 docker --log-level=debug build --pull --build-arg BUILDKIT_INLINE_CACHE=1 \
    	--tag ${REGISTRY}/react:${IMAGE_TAG} \
    	--file ./docker/React/Dockerfile .
docker-build-db:
	DOCKER_BUILDKIT=1 docker --log-level=debug build --pull --build-arg BUILDKIT_INLINE_CACHE=1 \
    	--tag ${REGISTRY}/db:${IMAGE_TAG} \
    	--file ./docker/DB/Dockerfile .

push:
	docker push ${REGISTRY}/backend:${IMAGE_TAG}
	docker push ${REGISTRY}/nginx:${IMAGE_TAG}
	docker push ${REGISTRY}/react:${IMAGE_TAG}
	docker push ${REGISTRY}/db:${IMAGE_TAG}

#DEPLOY
deploy:
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'docker network create --driver=overlay traefik-public || true'
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'rm -rf soulwarm_${BUILD_NUMBER} && mkdir soulwarm_${BUILD_NUMBER}'

	envsubst < docker-compose.yml > docker-compose-env.yml
	scp -o StrictHostKeyChecking=no -P ${PORT} docker-compose-env.yml deploy@${HOST}:soulwarm_${BUILD_NUMBER}/docker-compose.yml
	rm -f docker-compose-env.yml

	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'mkdir soulwarm_${BUILD_NUMBER}/secrets'
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'cp .secrets/* soulwarm_${BUILD_NUMBER}/secrets'
	ssh -o StrictHostKeyChecking=no deploy@${HOST} -p ${PORT} 'cd soulwarm_${BUILD_NUMBER} && docker stack deploy --compose-file docker-compose.yml soulwarm --with-registry-auth --prune'