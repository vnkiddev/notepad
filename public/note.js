const content = document.getElementById('content');
const save = document.getElementById('save');
const raw = document.getElementById('raw');

const slug = window.location.pathname.split('/')[2];

// Load note
(async () => {
  try {
    const res = await fetch(`/api/paste/${slug}`);
    
    if (!res.ok) {
      content.value = 'Note not found';
      content.disabled = true;
      save.disabled = true;
      return;
    }
    
    const data = await res.json();
    content.value = data.content;
    raw.href = `/raw/${slug}`;
  } catch (err) {
    content.value = 'Error loading note';
    content.disabled = true;
  }
})();

// Save changes
save.addEventListener('click', async () => {
  const text = content.value.trim();
  
  if (!text) {
    alert('Content cannot be empty');
    return;
  }
  
  try {
    const res = await fetch(`/api/paste/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });
    
    if (!res.ok) {
      alert('Error saving');
      return;
    }
    
    save.textContent = 'Saved!';
    setTimeout(() => {
      save.textContent = 'Save';
    }, 1500);
  } catch (err) {
    alert('Error saving');
  }
});
