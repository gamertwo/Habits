import { MongoClient } from 'mongodb';

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

// Connect lazily: importing this module (e.g. during `next build` page collection)
// must not require MONGODB_URI. Only an actual database call needs it.
function getClientPromise() {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add your Mongo URI (MONGODB_URI) to the environment');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function connectToDatabase() {
  const connected = await getClientPromise();
  return connected.db(process.env.MONGODB_DB);
}

export async function closeConnection() {
  if (client) {
    await client.close();
  }
}
