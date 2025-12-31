const content = document.getElementById('content');
const slug = document.getElementById('slug');
const save = document.getElementById('save');

save.addEventListener('click', async () => {
  const text = content.value.trim();
  
  if (!text) {
    alert('Please enter some text');
    return;
  }
  
  const customSlug = slug.value.trim();
  
  try {
    const res = await fetch('/api/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, slug: customSlug || undefined })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      alert(data.error || 'Error saving');
      return;
    }
    
    window.location.href = data.url;
  } catch (err) {
    alert('Error saving');
  }
});
