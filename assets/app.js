/* 共用小遊戲引擎：測驗 + 分類遊戲 */

function initTabs(){
  const btns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });
}

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/**
 * questions: [{q, options:[...], answer:index, explain}]
 */
function renderQuiz(containerEl, questions, opts){
  opts = opts || {};
  let idx = 0, score = 0;
  const qs = opts.shuffle ? shuffle(questions) : questions;

  function renderQuestion(){
    const item = qs[idx];
    containerEl.innerHTML = `
      <div class="progress-bar"><div class="progress-fill" style="width:${(idx/qs.length)*100}%"></div></div>
      <div style="font-size:.85em;color:#888;">第 ${idx+1} / ${qs.length} 題</div>
      <div class="q-title">${item.q}</div>
      <div class="opts"></div>
    `;
    const optsWrap = containerEl.querySelector('.opts');
    item.options.forEach((opt,i)=>{
      const b = document.createElement('button');
      b.className = 'opt-btn';
      b.textContent = opt;
      b.addEventListener('click',()=>selectAnswer(i));
      optsWrap.appendChild(b);
    });
  }

  function selectAnswer(i){
    const item = qs[idx];
    const btns = containerEl.querySelectorAll('.opt-btn');
    btns.forEach(b=>b.disabled = true);
    if(i === item.answer){
      btns[i].classList.add('correct');
      score++;
    } else {
      btns[i].classList.add('wrong');
      btns[item.answer].classList.add('correct');
    }
    const fb = document.createElement('div');
    fb.className = 'feedback ' + (i===item.answer ? 'ok' : 'no');
    fb.textContent = (i===item.answer ? '✅ 答對了！' : '❌ 再想想看：') + (item.explain||'');
    containerEl.appendChild(fb);

    const next = document.createElement('button');
    next.className = 'btn';
    next.textContent = idx < qs.length-1 ? '下一題 ➜' : '查看結果 🎉';
    next.addEventListener('click', ()=>{
      idx++;
      if(idx < qs.length) renderQuestion();
      else renderScore();
    });
    containerEl.appendChild(next);
  }

  function renderScore(){
    const pct = Math.round(score/qs.length*100);
    let tier = '再接再厲，回去複習一下吧！🌱';
    let emoji = '🌱';
    if(pct >= 90){ tier='超級科學小博士！太厲害了！'; emoji='🏆'; }
    else if(pct >= 70){ tier='表現很棒，快要全對了！'; emoji='🌟'; }
    else if(pct >= 50){ tier='有基礎了，再複習就更好！'; emoji='🌿'; }

    containerEl.innerHTML = `
      <div class="score-screen">
        <div class="big">${emoji}</div>
        <h2>得分：${score} / ${qs.length}（${pct}分）</h2>
        <p>${tier}</p>
        <button class="btn" id="retryBtn">再挑戰一次 🔁</button>
      </div>
    `;
    containerEl.querySelector('#retryBtn').addEventListener('click', ()=>{
      idx = 0; score = 0;
      renderQuestion();
    });
    if(opts.onFinish) opts.onFinish(score, qs.length);
  }

  renderQuestion();
}

/**
 * 分類遊戲：items:[{label, bucket}], buckets:[{key,label}]
 */
function renderClassify(containerEl, items, buckets, opts){
  opts = opts || {};
  const shuffled = shuffle(items);
  let selected = null;
  let correctCount = 0;
  let done = 0;

  containerEl.innerHTML = `
    <p style="color:#666;">先點選下方的卡片，再點選你認為正確的分類框。</p>
    <div class="classify-row" id="chipRow"></div>
    <div class="buckets" id="bucketRow"></div>
    <div id="classifyResult"></div>
  `;
  const chipRow = containerEl.querySelector('#chipRow');
  const bucketRow = containerEl.querySelector('#bucketRow');

  shuffled.forEach((it,i)=>{
    const chip = document.createElement('div');
    chip.className = 'classify-chip';
    chip.textContent = it.label;
    chip.dataset.idx = i;
    chip.addEventListener('click',()=>{
      if(chip.classList.contains('used')) return;
      containerEl.querySelectorAll('.classify-chip').forEach(c=>c.classList.remove('selected'));
      chip.classList.add('selected');
      selected = i;
    });
    chipRow.appendChild(chip);
  });

  buckets.forEach(bk=>{
    const b = document.createElement('div');
    b.className = 'bucket';
    b.innerHTML = `<h5>${bk.label}</h5><div class="items"></div>`;
    b.addEventListener('click',()=>{
      if(selected===null) return;
      const it = shuffled[selected];
      const chipEl = chipRow.querySelector(`[data-idx="${selected}"]`);
      const itemDiv = document.createElement('div');
      itemDiv.textContent = it.label;
      if(it.bucket === bk.key){
        itemDiv.className = 'item';
        itemDiv.textContent += ' ✅';
        correctCount++;
      } else {
        itemDiv.className = 'item wrong-drop';
        itemDiv.textContent += ' ❌ (正確答案：' + buckets.find(x=>x.key===it.bucket).label + ')';
      }
      b.querySelector('.items').appendChild(itemDiv);
      chipEl.classList.add('used');
      selected = null;
      done++;
      if(done === shuffled.length){
        const resultDiv = containerEl.querySelector('#classifyResult');
        resultDiv.innerHTML = `<div class="feedback ${correctCount===shuffled.length?'ok':'no'}">
          分類完成！答對 ${correctCount} / ${shuffled.length} 項。
          <br><button class="btn" id="classifyRetry">重新挑戰 🔁</button>
        </div>`;
        resultDiv.querySelector('#classifyRetry').addEventListener('click',()=>{
          correctCount = 0; done = 0;
          renderClassify(containerEl, items, buckets, opts);
        });
        if(opts.onFinish) opts.onFinish(correctCount, shuffled.length);
      }
    });
    bucketRow.appendChild(b);
  });
}
