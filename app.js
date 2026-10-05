// app.js - 个人图书收藏管理系统 (第一步：基础结构与动态渲染)
const form = document.querySelector('#book-form');
const titleInput = document.querySelector('#book-title');
const authorInput = document.querySelector('#book-author');
const categorySelect = document.querySelector('#book-category');
const ratingSelect = document.querySelector('#book-rating');
const notesInput = document.querySelector('#book-notes');
const formTip = document.querySelector('#form-tip');
const bookList = document.querySelector('#book-list');
const bookCount = document.querySelector('#book-count');

// 唯一状态数据源
let books = [];

// 星级符号映射函数
const getStars = (rating) => {
  const r = Number(rating) || 5;
  return '★'.repeat(r) + '☆'.repeat(5 - r);
};

// 统一渲染函数：遵循“先改数组，再调render”心智模型
const render = () => {
  bookList.innerHTML = '';
  bookCount.textContent = `共 ${books.length} 本`;

  if (books.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = '暂无图书收藏，请在上方表单添加一本吧！';
    bookList.appendChild(emptyDiv);
    return;
  }

  books.forEach((book) => {
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
    titleSpan.textContent = book.title; // 严格使用 textContent 杜绝 XSS 注入

    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag-badge';
    tagSpan.textContent = book.category;

    titleLine.appendChild(titleSpan);
    titleLine.appendChild(tagSpan);

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

    // 心得短评（如有）
    if (book.notes && book.notes.trim() !== '') {
      const notesP = document.createElement('div');
      notesP.className = 'book-notes';
      notesP.textContent = `“ ${book.notes} ”`;
      infoDiv.appendChild(notesP);
    }

    // 操作按钮区域
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'book-actions';

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.textContent = '🗑️ 删除';
    delBtn.addEventListener('click', () => {
      const idx = books.indexOf(book);
      if (idx !== -1) {
        books.splice(idx, 1); // 先改数组
        render();              // 再重绘界面
      }
    });

    actionsDiv.appendChild(delBtn);

    card.appendChild(infoDiv);
    card.appendChild(actionsDiv);
    bookList.appendChild(card);
  });
};

// 表单提交事件处理
form.addEventListener('submit', (e) => {
  e.preventDefault(); // 拦截默认表单跳转刷新

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const category = categorySelect.value;
  const rating = Number(ratingSelect.value);
  const notes = notesInput.value.trim();

  // 输入校验：必填字段判空
  if (title === '' || author === '') {
    formTip.textContent = '书名和作者为必填项，请补充完整';
    return;
  }

  // 状态数组新增记录
  books.push({
    id: Date.now(),
    title: title,
    author: author,
    category: category,
    rating: rating,
    notes: notes,
    status: '在读'
  });

  // 清空错误提示与输入框
  formTip.textContent = '';
  titleInput.value = '';
  authorInput.value = '';
  notesInput.value = '';

  render();
});

// 初始渲染
render();
