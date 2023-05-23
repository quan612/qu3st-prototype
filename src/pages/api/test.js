import { sleep } from "@util/index"
// import erc721Queue from "queues/erc721";


export default async function test(req, res) {

  // await trackRequest(req)
  // const job = await erc721Queue.add({ foo: 'http://example.com/video1.mov' });


  return res.status(200).json({ message: 'test successfully.' })
}

