const initialIngredients = [
  { name: 'ข้าวสวย', amount: 200, unit: 'กรัม', price: 45, priceUnit: 'กก.' },
  { name: 'เนื้อไก่', amount: 120, unit: 'กรัม', price: 180, priceUnit: 'กก.' },
  { name: 'ใบกะเพรา', amount: 15, unit: 'กรัม', price: 300, priceUnit: 'กก.' },
  { name: 'ซอสปรุงรส', amount: 15, unit: 'มล.', price: 80, priceUnit: 'ลิตร' },
  { name: 'ไข่ไก่', amount: 1, unit: 'ฟอง', price: 4.5, priceUnit: 'ฟอง' },
  { name: 'กล่องอาหาร', amount: 1, unit: 'ชิ้น', price: 4, priceUnit: 'ชิ้น' }
];

let ingredients = structuredClone(initialIngredients);
const units = ['กก.', 'กรัม', 'ลิตร', 'มล.', 'ชิ้น', 'ฟอง', 'แผ่น', 'ถุง', 'กล่อง', 'ขวด', 'แพ็ก', 'ช้อนโต๊ะ', 'ช้อนชา'];
const unitGroups = {
  mass: { 'กก.': 1000, 'กรัม': 1 },
  volume: { 'ลิตร': 1000, 'มล.': 1 },
  count: { 'ชิ้น': 1, 'ฟอง': 1, 'แผ่น': 1, 'ถุง': 1, 'กล่อง': 1, 'ขวด': 1, 'แพ็ก': 1 },
  spoon: { 'ช้อนโต๊ะ': 1, 'ช้อนชา': 1 }
};
const $ = (selector) => document.querySelector(selector);
const money = (value) => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getUnitInfo(unit) {
  for (const [group, values] of Object.entries(unitGroups)) {
    if (unit in values) return { group, factor: values[unit] };
  }
  return { group: 'other', factor: 1 };
}

function ingredientCost(ingredient) {
  const usageUnit = getUnitInfo(ingredient.unit);
  const priceUnit = getUnitInfo(ingredient.priceUnit || ingredient.unit);
  if (usageUnit.group !== priceUnit.group) return Number(ingredient.amount || 0) * Number(ingredient.price || 0);
  return (Number(ingredient.amount || 0) * usageUnit.factor / priceUnit.factor) * Number(ingredient.price || 0);
}

function renderIngredients() {
  const container = $('#ingredientRows');
  container.innerHTML = ingredients.map((ingredient, index) => `
    <tr>
      <td><input class="ingredient-name" data-index="${index}" type="text" value="${escapeHtml(ingredient.name)}" aria-label="ชื่อวัตถุดิบ" /></td>
      <td><input class="ingredient-amount" data-index="${index}" type="number" min="0" step="any" value="${ingredient.amount}" aria-label="ปริมาณ" /></td>
      <td><select class="ingredient-unit" data-index="${index}" aria-label="หน่วยที่ใช้">${units.map((unit) => `<option ${unit === ingredient.unit ? 'selected' : ''}>${unit}</option>`).join('')}</select></td>
      <td><input class="ingredient-price" data-index="${index}" type="number" min="0" step="any" value="${ingredient.price}" aria-label="ราคาซื้อ" /></td>
      <td><select class="ingredient-price-unit" data-index="${index}" aria-label="หน่วยราคา">${units.map((unit) => `<option ${unit === (ingredient.priceUnit || ingredient.unit) ? 'selected' : ''}>${unit}</option>`).join('')}</select></td>
      <td class="cost-cell">฿ ${money(ingredientCost(ingredient))}</td>
      <td><button class="remove-row" data-index="${index}" type="button" aria-label="ลบวัตถุดิบ">×</button></td>
    </tr>`).join('');
  $('#ingredientTotalLabel').textContent = `${ingredients.length} รายการ`;
  updateSummary();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function updateSummary() {
  const total = ingredients.reduce((sum, ingredient) => sum + ingredientCost(ingredient), 0);
  const servings = Math.max(Number($('#servings').value) || 1, 1);
  const margin = Math.max(Number($('#profitMargin').value) || 0, 0);
  const perServing = total / servings;
  const suggested = perServing * (1 + margin / 100);
  $('#totalCost').textContent = money(total);
  $('#costPerServing').textContent = `฿ ${money(perServing)}`;
  $('#servingSummary').textContent = `${servings} หน่วย`;
  $('#ingredientSummary').textContent = `${ingredients.length} รายการ`;
  $('#suggestedPrice').textContent = `฿ ${money(suggested)}`;
  $('#marginBarFill').style.width = `${Math.min(margin, 100)}%`;
}

function updateRowCost(index) {
  const row = document.querySelectorAll('#ingredientRows tr')[index];
  if (!row) return;
  const ingredient = ingredients[index];
  row.querySelector('.cost-cell').textContent = `฿ ${money(ingredientCost(ingredient))}`;
}

function saveRecipe() {
  const name = $('#recipeName').value.trim() || 'สูตรไม่มีชื่อ';
  const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
  const total = ingredients.reduce((sum, ingredient) => sum + ingredientCost(ingredient), 0);
  saved.unshift({
    name,
    category: $('#recipeCategory').value,
    servings: Number($('#servings').value) || 1,
    profitMargin: Number($('#profitMargin').value) || 0,
    notes: $('#recipeNotes').value,
    total,
    ingredients: structuredClone(ingredients),
    ingredientCount: ingredients.length,
    savedAt: new Date().toISOString()
  });
  localStorage.setItem('savedRecipes', JSON.stringify(saved.slice(0, 9)));
  renderSavedRecipes();
  showToast(`บันทึก “${name}” เรียบร้อยแล้ว`);
}

function renderSavedRecipes() {
  const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
  $('#savedCount').textContent = saved.length;
  $('#savedCountLabel').textContent = `${saved.length} สูตร`;
  $('#savedList').innerHTML = saved.length ? saved.map((recipe) => `
    <article class="saved-item" data-recipe-index="${saved.indexOf(recipe)}">
      <button class="saved-main" data-action="view" type="button">
        <span><strong>${escapeHtml(recipe.name)}</strong><small>${escapeHtml(recipe.category)} · ${recipe.servings} หน่วย · ${recipe.ingredientCount ?? recipe.ingredients ?? 0} รายการ</small></span>
        <span class="saved-view-label">ดูรายละเอียด</span><b>฿ ${money(recipe.total)}</b>
      </button>
      <button class="saved-delete" data-action="delete" type="button" aria-label="ลบสูตร ${escapeHtml(recipe.name)}" title="ลบสูตร">×</button>
    </article>`).join('') : '<div class="saved-empty">ยังไม่มีสูตรที่บันทึกไว้ สูตรที่คุณบันทึกจะแสดงตรงนี้</div>';
}

function showRecipeModal(index) {
  const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
  const recipe = saved[index];
  if (!recipe) return;
  const recipeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const servings = Math.max(Number(recipe.servings) || 1, 1);
  $('#modalRecipeName').textContent = recipe.name || 'สูตรไม่มีชื่อ';
  $('#modalRecipeMeta').textContent = `${recipe.category || 'ไม่ระบุหมวดหมู่'} · กำไร ${recipe.profitMargin ?? 0}%`;
  $('#modalTotal').textContent = `฿ ${money(recipe.total)}`;
  $('#modalPerPiece').textContent = `฿ ${money(recipe.total / servings)}`;
  $('#modalYield').textContent = `${servings} หน่วย`;
  $('#modalIngredientList').innerHTML = recipeIngredients.length ? recipeIngredients.map((ingredient) => `
    <div class="modal-ingredient-row"><span>${escapeHtml(ingredient.name || 'ไม่ระบุชื่อ')}</span><span>${ingredient.amount} ${escapeHtml(ingredient.unit)} · ${money(ingredient.price)} บาท/${escapeHtml(ingredient.priceUnit || ingredient.unit)} <b>฿ ${money(ingredientCost(ingredient))}</b></span></div>`).join('') : '<p class="modal-empty">สูตรเก่านี้ไม่มีรายละเอียดวัตถุดิบที่บันทึกไว้</p>';
  $('#modalNotes').textContent = recipe.notes || '';
  $('#modalNotesSection').hidden = !recipe.notes;
  $('#recipeModal').hidden = false;
  document.body.classList.add('modal-open');
}

function deleteRecipe(index) {
  const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
  const recipe = saved[index];
  if (!recipe) return;
  saved.splice(index, 1);
  localStorage.setItem('savedRecipes', JSON.stringify(saved));
  renderSavedRecipes();
  showToast(`ลบสูตร “${recipe.name}” แล้ว`);
}

function resetForm() {
  $('#recipeName').value = '';
  $('#recipeCategory').selectedIndex = 0;
  $('#servings').value = 1;
  $('#profitMargin').value = 60;
  $('#recipeNotes').value = '';
  ingredients = structuredClone(initialIngredients);
  renderIngredients();
  showToast('ล้างข้อมูลในฟอร์มแล้ว');
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

document.addEventListener('input', (event) => {
  const index = Number(event.target.dataset.index);
  if (event.target.classList.contains('ingredient-name')) ingredients[index].name = event.target.value;
  if (event.target.classList.contains('ingredient-amount')) ingredients[index].amount = Number(event.target.value) || 0;
  if (event.target.classList.contains('ingredient-price')) ingredients[index].price = Number(event.target.value) || 0;
  if (event.target.classList.contains('ingredient-amount') || event.target.classList.contains('ingredient-price')) updateRowCost(index);
  if (event.target.id === 'servings' || event.target.id === 'profitMargin' || event.target.classList.contains('ingredient-amount') || event.target.classList.contains('ingredient-price')) updateSummary();
});

document.addEventListener('change', (event) => {
  if (event.target.classList.contains('ingredient-unit')) ingredients[Number(event.target.dataset.index)].unit = event.target.value;
  if (event.target.classList.contains('ingredient-price-unit')) ingredients[Number(event.target.dataset.index)].priceUnit = event.target.value;
  if (event.target.classList.contains('ingredient-unit') || event.target.classList.contains('ingredient-price-unit')) {
    updateRowCost(Number(event.target.dataset.index));
    updateSummary();
  }
});

document.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-row')) {
    ingredients.splice(Number(event.target.dataset.index), 1);
    renderIngredients();
  }
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) {
    if (event.target.closest('[data-close-modal]')) closeRecipeModal();
    return;
  }
  const recipeCard = actionButton.closest('[data-recipe-index]');
  const recipeIndex = Number(recipeCard?.dataset.recipeIndex);
  if (actionButton.dataset.action === 'view') showRecipeModal(recipeIndex);
  if (actionButton.dataset.action === 'delete') deleteRecipe(recipeIndex);
});

function closeRecipeModal() {
  $('#recipeModal').hidden = true;
  document.body.classList.remove('modal-open');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#recipeModal').hidden) closeRecipeModal();
});

$('#addIngredientButton').addEventListener('click', () => {
  ingredients.push({ name: '', amount: 0, unit: 'กรัม', price: 0, priceUnit: 'กรัม' });
  renderIngredients();
  const names = document.querySelectorAll('.ingredient-name');
  names[names.length - 1].focus();
});
$('#saveButton').addEventListener('click', saveRecipe);
$('#resetButton').addEventListener('click', resetForm);
$('#todayDate').textContent = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());
renderIngredients();
renderSavedRecipes();
