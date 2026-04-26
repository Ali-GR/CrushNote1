// Test der Feed-Manager-Logik (buildFeedItems)
// Wir simulieren 10 Posts und schauen, wo die Anzeigen landen.

function buildFeedItems(posts) {
    const items = [];
    let postIdx = 0;
    let feedIndex = 0;
    while (postIdx < posts.length) {
        if ((feedIndex + 1) % 4 === 0) {
            items.push({ kind: 'ad', feedIndex });
        } else {
            items.push({ kind: 'post', data: posts[postIdx] });
            postIdx++;
        }
        feedIndex++;
    }
    return items;
}

const dummyPosts = Array(10).fill('Post Content');
const feed = buildFeedItems(dummyPosts);

console.log("Feed Struktur Test:");
feed.forEach((item, index) => {
    console.log(`Index ${index}: ${item.kind === 'ad' ? '📢 ANZEIGE' : '✅ Post'}`);
});
