## 우리는 도커를 사용해서 로컬 다이나모디비를 구축한다.

### 설치 및 실행 순서

1. docker pull amazon/dynamodb-local
2. aws dynamodb list-tables --endpoint-url http://localhost:8000
3. docker run -p 8000:8000 amazon/dynamodb-local
