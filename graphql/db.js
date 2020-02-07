import AWS from "aws-sdk";
import { aws_config } from "../config";

const local = false;
if (local)
  AWS.config.update({
    region: aws_config.region,
    endpoint: aws_config.endpoint
  });

var docClient = new AWS.DynamoDB.DocumentClient();

export async function createMovie(year, title, info) {
  const params = {
    TableName: "Movies",
    Item: {
      year: year,
      title: title,
      info: info
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
}

export async function getMovie(year, title) {
  console.log("haha!");
  var params = {
    TableName: "Movies",
    Key: {
      year: year,
      title: title
    }
  };

  try {
    const data = await docClient.get(params).promise();
    console.log("GetItem succeeded:", JSON.stringify(data.Item, null, 2));
    return data.Item;
  } catch (err) {
    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    return [];
  }
}
