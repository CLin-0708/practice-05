// app.js - 个人图书收藏管理系统 (第三步：事件委托重构、Blob数据导出与存储超量容错)
const form = document.querySelector('#book-form');
const titleInput = document.querySelector('#book-title');
const authorInput = document.querySelector('#book-author');
const categorySelect = document.querySelector('#book-category');
const ratingSelect = document.querySelector('#book-rating');
const notesInput = document.querySelector('#book-notes');
const formTip = document.querySelector('#form-tip');
const bookList = document.querySelector('#book-list');
const bookCount = document.querySelector('#book-count');
const searchInput = document.querySelector('#search-input');
const filterCategorySelect = document.querySelector('#filter-category');
const exportBtn = document.querySelector('#export-json-btn');
const testQuotaBtn = document.querySelector('#test-quota-btn');
const storageTip = document.querySelector('#storage-tip');

// 检索与筛选状态
let searchQuery = '';
let filterCategory = 'all';

// 启动时从 localStorage 恢复数据
let books = JSON.parse(localStorage.getItem('my_books') || '[]');

// 【研究任务三：存储容错研究】
// 使用 try...catch 捕获 localStorage 写入可能发生的 QuotaExceededError 异常
const save = () => {
  try {
    localStorage.setItem('my_books', JSON.stringify(books));
    // 写入成功且没有测试报警时，隐藏警告
    if (!storageTip.dataset.isTest) {
      storageTip.className = 'quota-warning';
      storageTip.textContent = '';
    }
  } catch (err) {
    console.warn('localStorage 写入异常:', err);
    storageTip.className = 'quota-warning show';
    storageTip.textContent = `⚠️ 本地存储空间已满（${err.name}），数据未能持久化保存，请及时导出备份！`;
  }
};

// 星级符号映射函数
const getStars = (rating) => {
  const r = Number(rating) || 5;
  return '★'.repeat(r) + '☆'.repeat(5 - r);
};

// 统一渲染函数：根据筛选条件过滤并生成 DOM
// 【研究任务一：事件委托改造说明】
// 此时 render() 内不再为每个卡片的各个按钮绑定单独的 addEventListener，
// 所有交互统一由父容器 bookList 代理处理！
const render = () => {
  bookList.innerHTML = '';

  const filtered = books.filter((book) => {
    const matchCat = filterCategory === 'all' || book.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  bookCount.textContent = `共 ${filtered.length} 本（总藏书 ${books.length} 本）`;

  if (filtered.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = books.length === 0 ? '暂无图书收藏，请在上方表单添加一本吧！' : '没有匹配到符合条件的图书';
    bookList.appendChild(emptyDiv);
    return;
  }

  filtered.forEach((book) => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.dataset.id = book.id; // 在父卡片挂载唯一 id，供事件委托定位

    // 信息主体容器
    const infoDiv = document.createElement('div');
    infoDiv.className = 'book-info';

    // 书名与分类标签行
    const titleLine = document.createElement('div');
    titleLine.className = 'book-title-line';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'book-title';
    titleSpan.textContent = book.title;

    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag-badge';
    tagSpan.textContent = book.category;

    const statusSpan = document.createElement('span');
    statusSpan.className = `status-badge ${book.status === '已读' ? 'status-read' : 'status-reading'}`;
    statusSpan.textContent = book.status;

    titleLine.appendChild(titleSpan);
    titleLine.appendChild(tagSpan);
    titleLine.appendChild(statusSpan);

    // 作者与评分行
    const metaDiv = document.createElement('div');
    metaDiv.className = 'book-meta';

    const authorSpan = document.createElement('span');
    authorSpan.textContent = `作者：${book.author}`;

    const ratingSpan = document.createElement('span');
    ratingSpan.className = 'book-rating';
    ratingSpan.textContent = getStars(book.rating);

    metaDiv.appendChild(authorSpan);
    metaDiv.appendChild(ratingSpan);

    infoDiv.appendChild(titleLine);
    infoDiv.appendChild(metaDiv);

    // 心得短评
    if (book.notes && book.notes.trim() !== '') {
      const notesP = document.createElement('div');
      notesP.className = 'book-notes';
      notesP.textContent = `“ ${book.notes} ”`;
      infoDiv.appendChild(notesP);
    }

    // 操作按钮区域：通过 data-action 标明操作行为，无需在每个按钮上绑监听
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-actions';

    const statusBtn = document.createElement('button');
    statusBtn.className = 'btn btn-sm btn-status';
    statusBtn.dataset.action = 'toggle-status';
    statusBtn.textContent = book.status === '在读' ? '✅ 标记为已读' : '📖 设为在读';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.dataset.action = 'delete';
    delBtn.textContent = '🗑️ 删除';

    actionsDiv.appendChild(statusBtn);
    actionsDiv.appendChild(delBtn);

    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    bookList.appendChild(card);
  });
};

// 【研究任务一：事件委托核心实现】
// 将原本每个卡片按钮的监听器收拢到父容器 bookList 上，利用冒泡机制统一分发
bookList.addEventListener('click', (e) => {
  const target = e.target;
  const action = target.dataset.action;
  if (!action) return; // 没点在带有 action 的按钮上则忽略

  const card = target.closest('.book-card');
  if (!card) return;
  const bookId = Number(card.dataset.id);
  const book = books.find((b) => b.id === bookId);
  if (!book) return;

  if (action === 'toggle-status') {
    book.status = book.status === '在读' ? '已读' : '在读';
    save();
    render();
  } else if (action === 'delete') {
    const idx = books.indexOf(book);
    if (idx !== -1) {
      books.splice(idx, 1);
      save();
      render();
    }
  }
});

// 【研究任务二：数据导出（Blob 与 URL.createObjectURL）】
exportBtn.addEventListener('click', () => {
  if (books.length === 0) {
    alert('当前收藏夹为空，暂无可导出的图书数据！');
    return;
  }

  // 1. 将数据序列化为格式化 JSON 字符串
  const dataStr = JSON.stringify(books, null, 2);

  // 2. 创建 Blob 二进制对象
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });

  // 3. 利用 URL.createObjectURL 生成指向该 Blob 的临时下载链接
  const downloadUrl = URL.createObjectURL(blob);

  // 4. 动态创建 <a> 标签模拟点击触发浏览器下载
  const tempLink = document.createElement('a');
  tempLink.href = downloadUrl;
  tempLink.download = `图书收藏备份_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(tempLink);
  tempLink.click();

  // 5. 清理 DOM 与释放临时 URL 资源
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(downloadUrl);
});

// 【研究任务三：故意实验——测试超量存储容错机制】
testQuotaBtn.addEventListener('click', () => {
  try {
    // 构造约 6MB 的超大文本尝试写入 localStorage（浏览器限额通常约为 5MB）
    const hugeChunk = 'A'.repeat(6 * 1024 * 1024);
    localStorage.setItem('__quota_experiment__', hugeChunk);
    alert('写入成功（未达到浏览器配额上限）');
  } catch (err) {
    // 成功捕获 QuotaExceededError 异常，避免程序崩溃并在页面优雅提示
    storageTip.dataset.isTest = 'true';
    storageTip.className = 'quota-warning show';
    storageTip.textContent = `🧪【故意实验观察】成功捕获到存储异常：${err.name} - ${err.message}。实验证明 localStorage 存在约 5MB 容量限制，try...catch 保护有效，控制台无未捕获崩溃报错！`;
  }
});

// 表单提交添加
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const category = categorySelect.value;
  const rating = Number(ratingSelect.value);
  const notes = notesInput.value.trim();

  if (title === '' || author === '') {
    formTip.textContent = '书名和作者为必填项，请补充完整';
    return;
  }

  books.push({
    id: Date.now(),
    title: title,
    author: author,
    category: category,
    rating: rating,
    notes: notes,
    status: '在读'
  });

  save();

  formTip.textContent = '';
  titleInput.value = '';
  authorInput.value = '';
  notesInput.value = '';

  render();
});

// 实时搜索
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  render();
});

// 分类筛选
filterCategorySelect.addEventListener('change', (e) => {
  filterCategory = e.target.value;
  render();
});

// 初始渲染
render();
