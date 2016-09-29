var neo4j = require('neo4j');
var request = require('superagent-bluebird-promise');
var striptags = require('striptags');
var elasticsearch = require('elasticsearch');
var async = require("async");

var db = new neo4j.GraphDatabase('http://neo4j:1234567890@docker.local:7474');
var client = new elasticsearch.Client({
    host: 'docker.local:9200'
});

var body = {
    band: {
        properties: {
            name: { "type": "string" },
            description: { "type": "string" },
            name_suggest: {
                "type": "completion",
                "analyzer": "simple",
                "search_analyzer": "simple",
                "payloads": true
            }

        }
    }
}

client.indices.putMapping({ index: "bands", type: "band", body: body });


var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

const firstYear = 1971
const thisYear = new Date().getFullYear();
const yearToMine = (thisYear - firstYear) + 1;
const url = "http://www.roskilde-festival.dk/api"

console.log(`First year ${firstYear}`);
console.log(`this year ${thisYear}`);
console.log(`total years ${yearToMine}`);

var createNodeQuery = (type, value) => {
    return {
        query: `MERGE (n:${type} { value: "${value}" }) RETURN n`
    }
}

var createRelationshipQuery = (Relationship, typeA, valueA, typeB, valueB) => {
    return {
        query: `MATCH (a:${typeA} { value: "${valueA}" }), (b:${typeB} { value: "${valueB}" }) Merge (a)-[:${Relationship}]->(b)`
    }
}
var createNode = (type, value) => {
    db.cypher({
        query: `MERGE (n:${type} { value: "${value}" }) RETURN n`
    }, (err, results) => {
        if (err) {
            console.log(err);
        }

    });
}
var createDescriptionNode = (type, value, description) => {
    db.cypher({
        query: `MERGE (n:${type} { value: "${value}", description: "${description}" }) RETURN n`
    }, (err, results) => {
        if (err) {
            console.log(err);
        }

    });
}
var createRelationship = (Relationship, typeA, valueA, typeB, valueB) => {
    db.cypher({
        query: `MATCH (a:${typeA} { value: "${valueA}" }), (b:${typeB} { value: "${valueB}" }) Merge (a)-[:${Relationship}]->(b)`
    }, (err, results) => {
        if (err) {
            console.log(err);
        }
    });
}

var sendAll = (queries) => {
    return new Promise((resolved, rejected) => {
        db.cypher({
            queries: queries
        }, (err, results) => {
            if (err) {
                console.log(err);
                return rejected(err);
            }
            return resolved(results)
        });
    })

}

var years = new Array(yearToMine)
for (var i = 0; i < years.length; i++) {
    years[i] = i + firstYear;
    createNode("Year", years[i])
}

var q = async.queue((task, callback) => {
    sendAll(task.queries)
        .then(() => callback())
        .catch((err) => callback(err));
}, 1);

var elasticQueue = async.queue((task, callback) => {
    client.index({
        index: 'bands',
        type: 'band',
        id: task.name.hashCode(),
        body: task
    }, function (error, response) {
        callback();
    });
}, 1);

// assign a callback
q.drain = function () {
    console.log('all items have been processed');
};

function getSuggestions(input) {
    return client.suggest({
        index: "bands",
        type: "band",
        body: {
            suggest: {
                text: input,
                completion: {
                    field: "suggest",
                    fuzzy: true
                }
            }
        }
    })
}
elasticQueue.drain = function () {
    console.log('all items have been processed');
    getSuggestions("NI").then((result)=>console.log(result));
};
promises = years.map((val, index) => {
    var requestUrl = `${url}/artists/${val}`;
    return request.get(requestUrl).then((result) => result.body);
});

var getDescription = (band) => {

    var bandName = entities.encode(band.displayName);
    var requestUrl = `${url}/artist/${band.year}/${band.urlParam}`;

    request.get(requestUrl)
        .then((result) => result.body)
        .then((details) => {
            if (!details.description) {
                details.description = band.description;
            }
            var description = striptags(details.body);
            createDescriptionNode("Description", bandName, entities.encode(description));
            createRelationship("Describes", "Description", bandName, "Band", bandName);

        })
        .catch((err) => {
            console.log(`Requesting ${band.urlParam} at ${requestUrl}`);

        });

};
String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

Promise.all(promises).then(values => {
    values.forEach((value) => {
        value.forEach((band) => {
            var queries = [];

            var bandName = entities.encode(band.displayName);
            var searchmodel = {
                name: band.displayName,
                description: band.description,
                name_suggest: {
                    input: band.displayName.split(" "),
                    output: band.displayName,
                    payload: { id: band.displayName.hashCode() }
                }
            }

            // queries.push(createNodeQuery("Band", bandName))
            // queries.push(createRelationshipQuery("Played", "Band", bandName, "Year", band.year))

            // band.countries.forEach(c => {
            //     queries.push(createNodeQuery("Country", c.name));
            //     queries.push(createRelationshipQuery("MembersFrom", "Band", bandName, "Country", c.name))
            // });

            // band.gigs.forEach(gig => {
            //     queries.push(createNodeQuery("Stage", gig.stage.name));
            //     queries.push(createRelationshipQuery("PlayedAt", "Band", bandName, "Stage", gig.stage.name));
            // })

            // var model = { queries: queries }

            // q.push(model, function (err) {
            //     if (err) {
            //         console.log(err);
            //         return;
            //     }
            // });

            elasticQueue.push(searchmodel, function (err) {
                if (err) {
                    console.log(err);
                    return;
                }
            });

            //setTimeout(() => getDescription(band), 200);
        })
    });
});

console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));