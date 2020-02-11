## Graphql을 서버리스로 아마존에 배포 및 로컬테스트

### git clone 하면 아래 작업을 모두 받고 사용만 할 수 있습니다.
### 처음부터 하시려면 순서대로 따라가면 됩니다.

1. yarn init
2. yarn add apollo-server-lambda graphql aws-sdk
3. Babel setting
    - yarn add babel-cli babel-preset-env babel-preset-stage-3 babel-core  babel-loader babel-polyfill --dev
    - yarn add webpack webpack-node-externals --dev
    - yarn add -g nodemon
    - .babelrc 생성 후 아래 코드 삽입

        {
          "presets": ["env", "stage-3"]
        }

    - package.json 에 아래 코드 추가

        "scripts": {
            "start": "serverless offline start"
          },

4. 아래 코드가 들어있는 index.js

        import { ApolloServer, gql } from "apollo-server-lambda";
        import resolvers from "./graphql/resolvers";
        import typeDefs from "./graphql/schema.graphql";
        
        const server = new ApolloServer({
          typeDefs,
          resolvers,
          context: ({ event, context }) => ({
            headers: event.headers,
            functionName: context.functionName,
            event,
            context
          })
        });
        
        export const graphqlHandler = server.createHandler({
          cors: {
            origin: true,
            credentials: true
          }
        });

5. serverless.yml 작성

        # serverless.yml
        
        service: apollo-server-lambda
        provider:
          name: aws # 저는 주로 아마존 웹서비스를 사용합니다.
          runtime: nodejs12.x # 저는 주로 노드를 사용합니다. 파이썬을 사용하기도 하는데 사용하고자 하는 파이썬 버전을 입력하시면 됩니다.
          stage: ${opt:stage, 'dev'} # 작성하지 않으면 기본적으로 'dev' 입니다.
          region: ap-northeast-2 # 입력하지 않으면 기본적으로 us-east-1 입니다.
          apiName: apollo-serverless
          stackName: apollo-serverless
          iamRoleStatements: # 필요한 권한들
            - Effect: Allow
              Action: # DynamoDB 관련 권한, 배포할 때는 리소스와 권한 설정 빡빡하게 잘 해주셔야합니다.
                - dynamodb:DescribeTable
                - dynamodb:Query
                - dynamodb:Scan
                - dynamodb:GetItem
                - dynamodb:PutItem
                - dynamodb:UpdateItem
                - dynamodb:DeleteItem
              Resource: "arn:aws:dynamodb:ap-northeast-2:*:*"
        functions:
          graphql:
            # this is formatted as <FILENAME>.<HANDLER>
            handler: index.graphqlHandler
            events:
              - http:
                  path: graphql
                  method: post
                  cors: true
              - http:
                  path: graphql
                  method: get
                  cors: true
        plugins:
          - serverless-offline
          - serverless-webpack

6. graphql 폴더 생성 후 그 안에 resolvers.js 와 schema.graphql 생성 후 작성

        //resolvers.js
        
        const people = [
          {
            id: 1,
            name: "a",
            age: 19,
            gender: "male"
          },
          {
            id: 2,
            name: "b",
            age: -10,
            gender: "female"
          },
          {
            id: 3,
            name: "c",
            age: 30,
            gender: "male"
          },
          {
            id: 4,
            name: "d",
            age: 4000,
            gender: "female"
          }
        ];
        
        function getById(id) {
          const filteredPeople = people.filter(person => person.id === id);
          return filteredPeople[0];
        }
        
        const resolvers = {
          Query: {
            people: () => people,
            person: (_, { id }) => getById(id)
          }
        };
        
        export default resolvers;

        // schema.graphql
        
        type Person {
          id: Int!
          name: String!
          age: Int!
          gender: String!
        }
        type Query {
          people: [Person]!
          person(id: Int!): Person
        }

7. 로컬 테스팅을 위해 
    - npm install serverless-offline@next serverless-webpack --save-dev
8. webpack.config.js 생성 후 아래 코드 삽입

        const path = require("path");
        const nodeExternals = require("webpack-node-externals");
        const slsw = require("serverless-webpack");
        
        module.exports = {
          entry: slsw.lib.entries,
          target: "node",
          mode: "development",
          externals: [nodeExternals()],
          output: {
            libraryTarget: "commonjs",
            path: path.join(__dirname, ".webpack"),
            filename: "[name].js"
          },
          module: {
            rules: [
              {
                test: /\.js$/,
                use: [
                  {
                    loader: "babel-loader"
                  }
                ]
              },
              {
                test: /\.(graphql|gql)$/,
                exclude: /node_modules/,
                loader: "graphql-tag/loader"
              }
            ]
          }
        };

9. yarn start 테스트 후 포스트맨으로 graphql query 테스트 

        query{
        	person{
        		name
        	}
        }

10. 배포와 삭제
    - serverless deploy
    - serverless remove

## dynamoDB 로컬 연동

1. docker pull amazon/dynamodb-local
2. aws dynamodb list-tables --endpoint-url http://localhost:8000
3. docker run -p 8000:8000 amazon/dynamodb-local
4. 아래 코드로 로컬 테이블 생성/없애기

        // CreateTable.js
        /**
         * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
         *
         * This file is licensed under the Apache License, Version 2.0 (the "License").
         * You may not use this file except in compliance with the License. A copy of
         * the License is located at
         *
         * http://aws.amazon.com/apache2.0/
         *
         * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
         * CONDITIONS OF ANY KIND, either express or implied. See the License for the
         * specific language governing permissions and limitations under the License.
         */
        var AWS = require("aws-sdk");
        
        AWS.config.update({
          region: "ap-northeast-2",
          endpoint: "http://localhost:8000"
        });
        
        var dynamodb = new AWS.DynamoDB();
        
        var params = {
          TableName: "Users",
          KeySchema: [
            { AttributeName: "year", KeyType: "HASH" }, //Partition key
            { AttributeName: "title", KeyType: "RANGE" } //Sort key
          ],
          AttributeDefinitions: [
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
          }
        };
        
        dynamodb.createTable(params, function(err, data) {
          if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
          }
        });

        // DeleteTable.js
        
        /**
         * Copyright 2010-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
         *
         * This file is licensed under the Apache License, Version 2.0 (the "License").
         * You may not use this file except in compliance with the License. A copy of
         * the License is located at
         *
         * http://aws.amazon.com/apache2.0/
         *
         * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
         * CONDITIONS OF ANY KIND, either express or implied. See the License for the
         * specific language governing permissions and limitations under the License.
         */
        var AWS = require("aws-sdk");
        
        AWS.config.update({
          region: "ap-northeast-2",
          endpoint: "http://localhost:8000"
        });
        
        var dynamodb = new AWS.DynamoDB();
        
        var params = {
          TableName: "Users",
          KeySchema: [
            { AttributeName: "year", KeyType: "HASH" }, //Partition key
            { AttributeName: "title", KeyType: "RANGE" } //Sort key
          ],
          AttributeDefinitions: [
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 10,
            WriteCapacityUnits: 10
          }
        };
        
        dynamodb.deleteTable({ TableName: "Users" }, function(err, data) {
          if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
          } else {
            console.log("Table deleted. Table description JSON:", JSON.stringify(data, null, 2));
          }
        });
        
## GraphQL Apollo 권한 및 인증

- 우선 resolvers에서 세번째 input인 context를 활용한다.

        const server = new ApolloServer({
          typeDefs,
          resolvers,
          context: ( {event} ) => {
            // if (!req.headers.authorization)
            //   throw new AuthenticationError("empty token");
            if (!event.headers.authorization) return { user: undefined };
        
            const token = event.headers.authorization.substr(7);
            const user = users.find(user => user.token === token);
            // if (!user) throw new AuthenticationError('invalid token');
            return { user };
          }
        });

- 자. 여기서 이해를 하고 넘어가야한다. context안에 맨 밑에 보면 `return { user }` 이게 있는데, context 에서 user를 불러오면 여기서 return 한 값을 읽어 올 수 있다.
- 무슨말인고 하니.. 처음에 들어올 때 server를 거치면서 context에 저 값을 저장하고 다른 resolvers로 들어가기 때문에 어떤 resolver 든 간에 input 으로 받는 3가지 (root, args, context)에서 3번째 context 를 통해 관문 통과하면서 받은 신분증으로 뭔가 저지를 수 있다 이거다!

        Mutation: {
            createMovie: async (_, { year, title, info },{user}) => {
        			if(!user) throw new Error("no auth");
        			else return await createMovie(year, title, info)
          }

    - 이런게 가능하다는 것이다! 유저설정이 없으면 no auth 로 에러 띄우기. 물론 권한도 넣으면 더 다채로워질 것이다.
- 이것의 장점은 auth가 필요 없는 함수는 그냥 실행시킬 수 있고 필요한 것만 가져다가 쓸 수 있다는 것.
- 마치 react 의 Context와 같다. ~~(출신지가 둘다 Facebook 이라서 그런가?)~~

## DynamoDB javascript(node) put get update

    // 생성
    var params = {
        TableName :"Movies",
        Item:{
            "year": 2015,
            "title": "The Big New Movie",
            "info":{
                "plot": "Nothing happens at all.",
                "rating": 0
            }
        }
    };
    try {
      const data = await docClient.put(params).promise();
      //console.log("PutItem succeeded:", params.Item.title);
      return params.Item;
    } catch (err) {
      //console.error("Unable to add movie", title, ". Error JSON:", JSON.stringify(err, null, 2));
      return null;
    }

    // 읽기
    var params = {
        TableName: table,
        Key:{
            "year": year,
            "title": title
        }
    };
    try {
      const data = await docClient.get(params).promise();
      //console.log("PutItem succeeded:", params.Item.title);
      return data.Item;
    } catch (err) {
      //console.error("Unable to add movie", title, ". Error JSON:", JSON.stringify(err, null, 2));
      return null;
    }

    // 업데이트
    var params = {
        TableName:table,
        Key:{
            "year": year,
            "title": title
        },
        UpdateExpression: "set info.rating = :r, info.plot=:p, info.actors=:a",
        ExpressionAttributeValues:{
            ":r":5.5,
            ":p":"Everything happens all at once.",
            ":a":["Larry", "Moe", "Curly"]
        },
        ReturnValues:"UPDATED_NEW"
    };
    
    try {
      const data = await docClient.update(params).promise();
      //console.log("PutItem succeeded:", params.Item.title);
      return data.Item;
    } catch (err) {
      //console.error("Unable to add movie", title, ". Error JSON:", JSON.stringify(err, null, 2));
      return null;
    }

## Serverless를 이용한 AWS 배포

- 이게 굉장히 복잡한 프로세스이기 때문에 정리가 필요했다.
- .babelrc

        {
          "presets": [
            [
              "env",
              {
                "targets": {
                  "node": "12.14"
                }
              }
            ],
            "stage-3"
          ]
        }

- db.js (anywhere that use database(dynamoDB))

        const local = false;
        if (local)
          AWS.config.update({
            region: aws_config.region,
            endpoint: aws_config.endpoint
          });

    - 이런식으로 region과 endpoint 설정해주는 곳을 실행못하게 막자.
- serverless.yml 에 추가

        custom:
          stage: ${opt:stage, self:provider.stage}
          webpack:
            includeModules: true
          tableName: Movies
          tableThroughputs:
            prod: 5
            default: 1
          tableThroughput: ${self:custom.tableThroughputs.${self:custom.stage}, self:custom.tableThroughputs.default}
        
        # dynamoDB create table
        resources:
          - Resources:
              NotesTable:
                Type: AWS::DynamoDB::Table
                Properties:
                  TableName: ${self:custom.tableName}
                  AttributeDefinitions:
                    - AttributeName: year
                      AttributeType: N
                    - AttributeName: title
                      AttributeType: S
                  KeySchema:
                    - AttributeName: year
                      KeyType: HASH
                    - AttributeName: title
                      KeyType: RANGE
                  # Set the capacity based on the stage
                  ProvisionedThroughput:
                    ReadCapacityUnits: ${self:custom.tableThroughput}
                    WriteCapacityUnits: ${self:custom.tableThroughput}
- serverless deploy
