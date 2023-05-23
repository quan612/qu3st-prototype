// import { sleep } from "@util/index"
// const Bull = require('bull')

// const redisUrl = "redis://default:redispw@localhost:49153";
// const erc721Queue = new Bull('erc721', {
//   redis: {
//     port: 49153, host: '127.0.0.1', password: 'redispw',
//     // tls: {},
//     connectTimeout: 30000
//   },
//   removeOnComplete: true,
//   limiter: {
//     max: 1,
//     duration: 10000
//   }
//   // connectTimeout: 30000
// });
// // const erc721Queue = new Queue('erc721');

// export default erc721Queue;

// erc721Queue
//   .isReady()
//   .then(() => {
//     console.info(
//       `[INIT] Report queue is connected to Redis `
//     );
//   })
//   .catch((error) => {
//     console.error(`[ERROR] Couldn't connect to Redis, got error: ${error}`);
//   });

// // Report Queue Event Listeners
// erc721Queue.on('waiting', (jobID) => {
//   console.info(`[ADDED] Job added with job ID ${jobID}`);
// });
// erc721Queue.on('active', (job) => {
//   console.info(`[STARTED] Job ID ${job.id} has been started`);
// });
// erc721Queue.on('completed', (job) => {
//   console.info(`[COMPLETED] Job ID ${job.id} has been completed`);
// });
// erc721Queue.on('failed', (job) => {
//   console.error(`[FAILED] Job ID ${job.id} has been failed`);
// });
// erc721Queue.on('error', (job) => {
//   console.error(`[ERROR] An error occurred by the queue, got ${job}`);
// });
// erc721Queue.on('cleaned', function () {
//   console.info(`[CLEANED] Report queue has been cleaned`);
// });
// erc721Queue.on('drained', function () {
//   console.info(`[WAITING] Waiting for jobs...`);
// });

// // Report Queue job processor
// erc721Queue.process(async ({ data }) => {
//   // Do the business logic
//   // ...
//   console.log("Processing job")
//   // Process and save report data to database
//   // ...

//   console.log("job start")
//   await sleep(4000)

//   console.log("job end")
//   // done();
//   // return Promise.resolve();
//   return Promise.resolve();

// });