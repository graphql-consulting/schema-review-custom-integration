const fetch = require('node-fetch');
const url = 'https://backend.graphql-consulting.com/graphql';

async function example() {
    const secretId = await createSecret();
    console.log(`secretId: ${secretId}`);

    const firstSchema = `
    type Query {
        foo: String
    }
    `;
    await saveSchemaVersion(secretId, "1", firstSchema);

    const changedSchema = `
        type Query {
            fooChanged: String
        }
    `;

    const reviewSchemaResult = await reviewSchema(secretId, "1", "2", changedSchema, "");
    console.log(JSON.stringify(reviewSchemaResult, 0, 2));
}

async function saveSchemaVersion(secretId, commitSha, sdl) {
    const query = `
    mutation m($input: NewSchemaVersionPayload!) {
        newSchemaVersion(input: $input) {
          success
          message
      }
    }
    `;
    const variables = {
        input: {
            secretId,
            sha: commitSha,
            schema: sdl
        }
    };
    return sendGraphQL(query, variables, url);
}

async function reviewSchema(secretId, baseSha, headSha, sdl, configFile) {
    const query = `
    mutation m($input: ReviewSchemaPayload!) {
        reviewSchema(input: $input) {
          success
          message
          reviewAsMarkdown
          ruleResults {
            severity
            message
            ruleName
            line
          }
        }
      }
    `;
    const variables = {
        input: {
            secretId,
            baseSha,
            headSha,
            schema: sdl,
            configFile
        }
    };
    return sendGraphQL(query, variables, url);
}


async function createSecret() {
    const query = `
        mutation m {
            registerNewRepo(input: {name: "My repo"}) {
               success
               message
               secretId
             }
    }
    `;
    const response = await sendGraphQL(query, {}, url);
    const secretId = response.data.registerNewRepo.secretId;
    return secretId;
}



async function sendGraphQL(query, variables, url) {
    const body = {
        query,
        variables
    };
    return await fetch(url + "?secret=na", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(res => {
        // console.log('send graphql response:', res);
        return res.json().then(json => {
            console.log('send graphql response body:', json);
            return json;
        });
    });
}

example();