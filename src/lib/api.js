export default {
	IMAGE_UPLOADER: 'https://script.google.com/macros/s/AKfycbwZ2fTci4u0SzwlmvgYDp_JhPxYCqgdGCd21dkzdzLvKsI5-27KEIngIlYwHzo8Wj7T4Q/exec',
	LIST: 'https://script.google.com/macros/s/AKfycbyJD_YEffYNIytm-iIXj0-teNvdFCvSqcwaaTAitd1ce3qrmZiLBta9Q4HfxEC7YWSYWQ/exec',
	REMOVE_CONTENT: 'https://script.google.com/macros/s/AKfycbzW0WvGhP9_U4XbRRyHaxR15v2_hmt6mD-qFG1vxpVngGr7mGKlxCUIoV4vQuUzfOFIkA/exec',
	UPDATE_CERCLES: 'https://script.google.com/macros/s/AKfycbxZIZ-Io4ZXiQLnTaQUH_2CLISyJ6VlbdCIw_eMvXqktvXPUF1qAMnKgWY55ImByW664g/exec',
	AUTHORIZE_USER: 'https://script.google.com/macros/s/AKfycbzUQRq_C0Xjh7v2wBwwNoSCGlYIlskukjrk2eYcERBSVFdUTj0dv_CjsX9kzrPyyfSH/exec',
	IMAGE_DELIVERY: 'https://script.google.com/macros/s/AKfycbw4G5wle6kaWoulivxT8x4EP7Tcq5QII4ujserbLAdhvFT3X5dR3WLPd1F0kGEzMb6o/exec',
	post,
	get,
	getText,
};

async function post(endpoint, payload) {
	const response = await fetch(endpoint, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'text/plain;charset=utf-8', // CORSのプリフライトリクエストを避けるため
		},
	});
	const result = await response.json();
	if (result.status === 'success') {
		return result;
	} else {
		throw new Error(result.message || 'Unknown error occurred.');
	}
}

async function get(endpoint) {
	const response = await fetch(endpoint);
	const result = await response.json();
	if (result.status === 'success') {
		return result;
	} else {
		throw new Error(result.message || 'Unknown error occurred.');
	}
}

async function getText(endpoint) {
	const response = await fetch(endpoint);
	const result = await response.text();
	return result;
}