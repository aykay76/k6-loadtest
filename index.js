import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
};

export default function() {
  let res = http.get('https://your.website.com/');
  getResources(res)
  check(res, { 'status was 200': r => r.status == 200 });
  sleep(1);
}

/**
* @param {http.RefinedResponse<http.ResponseType>} response
*/
export function getResources(response) {
const resources = [];
response
    .html()
    .find('*[href]:not(a)')
    .each((index, element) => {
    resources.push(element.attributes().href.value);
    });
response
    .html()
    .find('*[src]:not(a)')
    .each((index, element) => {
    resources.push(element.attributes().src.value);
    });

if (options.concurrentResourceLoading) {
    const responses = http.batch(
    resources.map((r) => {
        return ['GET', resolveUrl(r, response.url), null, { headers: createHeader() }];
    })
    );
    responses.forEach(() => {
    check(response, {
        'resource returns status 200': (r) => r.status === 200,
    });
    });
} else {
    resources.forEach((r) => {
    const res = http.get(resolveUrl(r, response.url), {
        headers: createHeader(),
    });
    !check(res, {
        'resource returns status 200': (r) => r.status === 200,
    });
    });
}
}
