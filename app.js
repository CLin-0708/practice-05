// app.js - 个人图书收藏管理系统 (第二步：查询检索、状态修改与本地存储)
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

// 检索与筛选状态
let searchQuery = '';
let filterCategory = 'all';

// 启动时从 localStorage 恢复数据
let books = JSON.parse(localStorage.getItem('my_books') || '[]');

// 持久化存储函数
const save = () => {
  localStorage.setItem('my_books', JSON.stringify(books));
};

// 星级符号映射函数
const getStars = (rating) => {
  const r = Number(rating) || 5;
  return '★'.repeat(r) + '☆'.repeat(5 - r);
};

// 统一渲染函数：根据筛选条件过滤并生成 DOM
const render = () => {
  bookList.innerHTML = '';

  // 根据搜索关键字与分类筛选
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

    // 状态徽章（在读 / 已读）
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

    // 操作按钮区域
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-actions';

    // 切换阅读状态按钮（满足“修改”要求）
    const statusBtn = document.createElement('button');
    statusBtn.className = 'btn btn-sm btn-status';
    statusBtn.textContent = book.status === '在读' ? '✅ 标记为已读' : '📖 设为在读';
    statusBtn.addEventListener('click', () => {
      book.status = book.status === '在读' ? '已读' : '在读'; // 修改对象属性
      save(); // 保存到 localStorage
      render(); // 重绘
    });

    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.textContent = '🗑️ 删除';
    delBtn.addEventListener('click', () => {
      const idx = books.indexOf(book);
      if (idx !== -1) {
        books.splice(idx, 1);
        save(); // 保存到 localStorage
        render();
      }
    });

    actionsDiv.appendChild(statusBtn);
    actionsDiv.appendChild(delBtn);

    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    bookList.appendChild(card);
  });
};

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

  save(); // 保存到本地

  formTip.textContent = '';
  titleInput.value = '';
  authorInput.value = '';
  notesInput.value = '';

  render();
});

// 实时搜索关键词监听 (input事件)
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  render();
});

// 分类筛选监听 (change事件)
filterCategorySelect.addEventListener('change', (e) => {
  filterCategory = e.target.value;
  render();
});

// 初始渲染
render();
