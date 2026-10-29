(() => {
  const ADMIN_UID = '01fbcfb4-5943-4c96-bd28-f21cf64a850f';
  const ADMIN_EMAIL = 'pobreflix.conta.oficial@gmail.com';
  const state = { client: null, user: null, profile: null, ready: false, config: null };
  const $ = (selector, root = document) => root.querySelector(selector);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const page = () => location.pathname.split('/').pop() || 'index.html';
  const setMessage = (message, kind = 'error') => {
    const el = $('#error') || $('[data-auth-message]');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('show', Boolean(message));
    el.dataset.kind = kind;
  };
  const friendlyError = (error) => {
    const message = String(error?.message || error || 'Não foi possível concluir a operação.');
    if (/invalid login credentials/i.test(message)) return 'Email ou senha incorretos.';
    if (/user already registered/i.test(message)) return 'Este email já está cadastrado.';
    if (/email not confirmed/i.test(message)) return 'Confirme seu email antes de entrar.';
    if (/failed to fetch|network|load failed|offline|fetch failed/i.test(message)) return 'Não foi possível conectar ao serviço agora. Verifique sua conexão e tente novamente.';
    return message.replace(/^AuthApiError:\s*/i, '');
  };
  const safeNextUrl = () => {
    const fallback = 'catalago.html';
    const next = new URLSearchParams(location.search).get('next');
    if (!next || next.startsWith('//') || next.includes('\\')) return fallback;
    try {
      const target = new URL(next, location.href);
      if (!['http:', 'https:'].includes(target.protocol) || target.origin !== location.origin) return fallback;
      const targetPath = decodeURIComponent(target.pathname);
      if (/(^|\/)(login|signup)\.html$/i.test(targetPath)) return fallback;
      return target.href;
    } catch (_) { return fallback; }
  };
  const escapeText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const safeTags = (html) => {
    if (!html) return '';
    const template = document.createElement('template'); template.innerHTML = html;
    const allowed = new Set(['META', 'LINK', 'STYLE', 'TITLE', 'P', 'SPAN', 'DIV']);
    const walk = node => [...node.children].forEach(child => {
      if (!allowed.has(child.tagName)) child.remove();
      else { [...child.attributes].forEach(attr => { const n = attr.name.toLowerCase(); if (n.startsWith('on') || n === 'srcdoc' || (n === 'href' && /^javascript:/i.test(attr.value))) child.removeAttribute(attr.name); }); walk(child); }
    });
    walk(template.content); return template.innerHTML;
  };
  const isAdmin = (user = state.user) => Boolean(user && user.id === ADMIN_UID && user.email?.toLowerCase() === ADMIN_EMAIL);
  const getClient = () => state.client;
  const requireAdmin = () => { if (!isAdmin()) { location.href = 'login.html?next=painel.admin.html'; return false; } return true; };
  const showUserState = () => {
    all('[data-auth-user]').forEach(el => { el.textContent = state.profile?.display_name || state.user?.email || 'Visitante'; });
    all('[data-profile-name]').forEach(el => { el.textContent = state.profile?.display_name || state.user?.email || 'Meu perfil'; });
    all('[data-admin-link]').forEach(el => { el.hidden = !isAdmin(); });
    if (isAdmin() && !document.querySelector('[data-injected-admin-link]')) { const link = document.createElement('a'); link.href = 'painel.admin.html'; link.textContent = 'Painel admin'; link.dataset.injectedAdminLink = 'true'; link.className = 'pf-admin-link'; document.body.appendChild(link); }
  };
  const applySeo = async () => {
    if (!state.client) return;
    const pagePath = location.pathname.replace(/\.html$/, '') || '/';
    const { data } = await state.client.from('seo_settings').select('title,description,keywords,head_tags,body_tags').eq('page_path', pagePath).eq('published', true).maybeSingle();
    if (!data) return;
    if (data.title) document.title = data.title;
    document.querySelectorAll('[data-pobreflix-seo-body]').forEach(el => el.remove());
    const upsertMeta = (name, content) => { if (!content) return; let el = document.head.querySelector(`meta[name="${name}"]`); if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); } el.content = content; };
    upsertMeta('description', data.description); upsertMeta('keywords', data.keywords);
    const head = safeTags(data.head_tags); if (head) document.head.insertAdjacentHTML('beforeend', head);
    const body = safeTags(data.body_tags); if (body) { const wrapper = document.createElement('div'); wrapper.dataset.pobreflixSeoBody = 'true'; wrapper.innerHTML = body; document.body.appendChild(wrapper); }
  };
  const bindAuth = () => {
    const form = $('#loginForm'); if (!form || form.dataset.pobreflixBound) return;
    form.dataset.pobreflixBound = 'true'; const email = $('#email', form);
    const queryEmail = new URLSearchParams(location.search).get('email'); if (queryEmail && email) email.value = queryEmail;
    let password = $('#password', form);
    if (!password && (page() === 'login.html' || page() === 'signup.html')) { password = document.createElement('input'); password.className = email?.className || 'entry'; password.id = 'password'; password.type = 'password'; password.autocomplete = page() === 'login.html' ? 'current-password' : 'new-password'; password.placeholder = page() === 'login.html' ? 'Senha' : 'Senha (mínimo 8 caracteres)'; password.style.marginTop = '9px'; email?.after(password); }
    if (page() === 'login.html' && !form.dataset.pobreflixLoginBound) {
      form.dataset.pobreflixLoginBound = 'true';
      form.addEventListener('submit', async event => {
        event.preventDefault(); const e = $('#email', form)?.value.trim(); const p = $('#password', form)?.value || ''; if (!e || !p) return setMessage('Informe email e senha.'); if (!state.client) return setMessage('Não foi possível iniciar o login: a configuração do Supabase não está disponível.'); setMessage('Entrando…', 'loading');
        try { const { error } = await state.client.auth.signInWithPassword({ email: e, password: p }); if (error) return setMessage(friendlyError(error)); setMessage('Login realizado.', 'success'); location.href = safeNextUrl(); }
        catch (error) { setMessage(friendlyError(error)); }
      });
    }
    if (page() === 'signup.html' && !form.dataset.pobreflixSignupBound) {
      form.dataset.pobreflixSignupBound = 'true';
      form.addEventListener('submit', async event => {
        event.preventDefault(); const e = $('#email', form)?.value.trim(); const p = $('#password', form)?.value || ''; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '')) return setMessage('Informe um email válido.'); if (p.length < 8) return setMessage('A senha precisa ter pelo menos 8 caracteres.'); if (!state.client) return setMessage('Não foi possível criar a conta: a configuração do Supabase não está disponível.'); setMessage('Criando sua conta…', 'loading');
        try { const { data, error } = await state.client.auth.signUp({ email: e, password: p, options: { data: { display_name: e.split('@')[0] } } }); if (error) return setMessage(friendlyError(error)); if (data.user) await state.client.from('profiles').upsert({ id: data.user.id, email: e, display_name: e.split('@')[0] }, { onConflict: 'id' }); setMessage('Conta criada. Verifique seu email para confirmar o acesso.', 'success'); }
        catch (error) { setMessage(friendlyError(error)); }
      });
    }
  };
  const bindLandingSignup = () => all('form.signup').forEach(form => { if (form.dataset.pobreflixLandingBound) return; form.dataset.pobreflixLandingBound = 'true'; form.addEventListener('submit', event => { event.preventDefault(); const email = $('input[type="email"]', form)?.value.trim(); if (email) location.href = `signup.html?email=${encodeURIComponent(email)}`; }); });
  const bindSubscriptionGate = () => {
    if (page() !== 'index.html' && page() !== '') return;
    const gate = $('#subscriptionGate'), continueButton = $('#subscriptionContinue'), deviceGate = $('#deviceGate'), deviceContinue = $('#deviceContinue'); if (!gate || !continueButton) return;
    if (gate.dataset.pobreflixBound) return; gate.dataset.pobreflixBound = 'true';
    const storedPlan = sessionStorage.getItem('pobreflix_plan_v1'), storedDevices = sessionStorage.getItem('pobreflix_device_v1');
    const showSubscription = () => { if (storedPlan) { gate.classList.add('is-leaving'); setTimeout(() => gate.remove(), 600); return; } gate.classList.add('is-ready'); };
    if (storedDevices) { deviceGate?.classList.add('is-leaving'); setTimeout(() => deviceGate?.remove(), 600); showSubscription(); }
    else if (deviceGate && deviceContinue) {
      const selectedDevices = new Set();
      all('[data-device]', deviceGate).forEach(card => card.addEventListener('click', () => { const key = card.dataset.device; selectedDevices.has(key) ? selectedDevices.delete(key) : selectedDevices.add(key); card.classList.toggle('is-selected', selectedDevices.has(key)); card.setAttribute('aria-pressed', String(selectedDevices.has(key))); deviceContinue.disabled = selectedDevices.size === 0; deviceContinue.textContent = selectedDevices.size ? `Próximo (${selectedDevices.size})` : 'Próximo'; }));
      deviceContinue.addEventListener('click', () => { if (!selectedDevices.size) return; sessionStorage.setItem('pobreflix_device_v1', [...selectedDevices].join(',')); deviceGate.classList.add('is-leaving'); setTimeout(() => deviceGate.remove(), 600); showSubscription(); });
    } else showSubscription();
    let selected = '';
    all('[data-plan]', gate).forEach(card => card.addEventListener('click', () => { selected = card.dataset.plan; all('[data-plan]', gate).forEach(item => { const active = item === card; item.classList.toggle('is-selected', active); item.setAttribute('aria-pressed', String(active)); }); continueButton.disabled = false; continueButton.textContent = `Continuar com ${card.querySelector('h3')?.textContent || 'sua escolha'}`; }));
    continueButton.addEventListener('click', () => { if (!selected) return; sessionStorage.setItem('pobreflix_plan_v1', selected); gate.classList.add('is-leaving'); setTimeout(() => gate.remove(), 600); });
  };
  const saveContact = async (message, email = '', name = '') => {
    if (!state.client) return { error: new Error('Supabase não está configurado.') };
    return state.client.from('contact_messages').insert({ user_id: state.user?.id || null, name: name || state.user?.user_metadata?.display_name || '', email: email || state.user?.email || '', message });
  };
  const bindContactForms = () => {
    const searchForm = $('#searchForm'); if (searchForm && !searchForm.dataset.pobreflixBound) { searchForm.dataset.pobreflixBound = 'true'; searchForm.addEventListener('submit', async event => { event.preventDefault(); const input = $('#problem', searchForm); const message = $('#message'); if (!input?.value.trim()) { if (message) message.textContent = 'Descreva sua dúvida antes de enviar.'; return; } try { const result = await saveContact(input.value.trim()); if (message) message.textContent = result.error ? friendlyError(result.error) : 'Sua mensagem foi registrada. Nossa equipe poderá consultá-la no painel.'; if (!result.error) searchForm.reset(); } catch (error) { if (message) message.textContent = friendlyError(error); } }); }
    all('#supportForm,#reportForm').forEach(form => { if (form.dataset.pobreflixBound) return; form.dataset.pobreflixBound = 'true'; form.addEventListener('submit', async event => { event.preventDefault(); const data = new FormData(form); const values = [...data.entries()].map(([key, value]) => `${key}: ${value}`).join('\n'); const note = $('.form-note', form); try { const result = await saveContact(values); if (note) note.textContent = result.error ? friendlyError(result.error) : 'Solicitação registrada no Supabase para análise.'; if (!result.error) form.reset(); } catch (error) { if (note) note.textContent = friendlyError(error); } }); });
  };
  const loadProfile = async () => {
    if (!state.client || !state.user) return;
    const result = await state.client.from('profiles').select('id,email,display_name,bio,avatar_url').eq('id', state.user.id).maybeSingle();
    if (result.error) { console.warn('Perfil Supabase:', friendlyError(result.error)); return; }
    state.profile = result.data || { id: state.user.id, email: state.user.email, display_name: state.user.email?.split('@')[0] || 'Meu perfil', bio: '' };
    try { if (state.profile.display_name) localStorage.setItem('pobreflix_profile_name_v1', state.profile.display_name); } catch (_) {}
    const name = $('#profileName'), bio = $('#profileBio'), email = $('#accountEmail');
    if (name && state.profile.display_name) name.value = state.profile.display_name;
    if (bio) bio.value = state.profile.bio || '';
    if (email) email.value = state.profile.email || state.user.email || '';
    showUserState();
  };

  const bindProfilePersistence = () => {
    const save = $('#saveButton'); if (!save || save.dataset.pobreflixBound) return; save.dataset.pobreflixBound = 'true';
    save.addEventListener('click', async () => { const status = $('#status'); const set = (text, kind = '') => { if (status) { status.textContent = text; status.dataset.kind = kind; } }; if (!state.client || !state.user) return set('Não foi possível salvar: é necessário ter uma sessão ativa e o Supabase configurado.', 'error'); const name = $('#profileName')?.value.trim() || ''; const bio = $('#profileBio')?.value.trim() || ''; const email = $('#accountEmail')?.value.trim() || state.user.email || ''; const password = $('#accountPassword')?.value || '';
      try { const profile = await state.client.from('profiles').upsert({ id: state.user.id, email, display_name: name, bio, updated_at: new Date().toISOString() }, { onConflict: 'id' }); if (profile.error) return set(friendlyError(profile.error), 'error'); if (password) { const updated = await state.client.auth.updateUser({ password }); if (updated.error) return set(friendlyError(updated.error), 'error'); $('#accountPassword').value = ''; } set('Perfil salvo no Supabase. A senha nunca é armazenada no navegador.', 'success'); }
      catch (error) { set(friendlyError(error), 'error'); }
    });
  };
  const createCatalogCard = title => { const link = document.createElement('a'); link.className = 'tile'; link.href = `detalhes.html?db=${encodeURIComponent(title.id)}`; link.dataset.contentId = title.id; link.style.textDecoration = 'none'; const image = document.createElement('img'); image.src = title.poster_url || 'assets/cards/card-1.jpg'; image.alt = title.title; image.loading = 'lazy'; const label = document.createElement('span'); label.className = 'tile-name'; label.textContent = title.title; link.append(image, label); return link; };
  const loadPublishedTitles = async () => {
    if (page() !== 'catalago.html' || !state.client) return; const { data, error } = await state.client.from('titles').select('id,title,description,poster_url,banner_url,genre,content_type,video_url').eq('published', true).order('created_at', { ascending: false }); if (error) { console.warn('Catálogo Supabase:', friendlyError(error)); return; } if (!data?.length) return;
    const catalog = $('.catalog'); if (!catalog) return; $('.pf-supabase-row', catalog)?.remove(); const row = document.createElement('section'); row.className = 'row pf-supabase-row'; const heading = document.createElement('h2'); heading.textContent = 'Adicionados pelo painel'; const railwrap = document.createElement('div'); railwrap.className = 'railwrap'; const rail = document.createElement('div'); rail.className = 'rail'; data.forEach(item => rail.appendChild(createCatalogCard(item))); railwrap.appendChild(rail); row.append(heading, railwrap); catalog.insertBefore(row, catalog.firstChild);
  };
  const loadDbDetail = async () => {
    if (page() !== 'detalhes.html' || !state.client) return; const id = new URLSearchParams(location.search).get('db'); if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return; const { data, error } = await state.client.from('titles').select('*').eq('id', id).eq('published', true).maybeSingle(); if (error || !data) return;
    const set = (selector, value) => { const el = $(selector); if (el) el.textContent = value || ''; }; set('#title', data.title); set('#heroCardTitle', data.title); set('#desc', data.description); set('#about', data.description); set('#genres', data.genre); if (data.banner_url) { const art = $('#heroArt'); if (art) art.style.backgroundImage = `linear-gradient(90deg,#050507dd 0%,#05050788 48%,#05050722 100%), url("${data.banner_url.replace(/"/g, '')}")`; } else if (data.poster_url) { const art = $('#heroArt'); if (art) art.style.backgroundImage = `url("${data.poster_url.replace(/"/g, '')}")`; } if (data.poster_url) { const card = $('#heroCardArt'); if (card) card.style.backgroundImage = `linear-gradient(0deg,#0008,transparent), url("${data.poster_url.replace(/"/g, '')}")`; }
    const watch = $('#watch'); if (watch) { watch.onclick = () => { if (!data.video_url) return; location.href = `playervideo.html?db=${encodeURIComponent(data.id)}&video=${encodeURIComponent(data.video_url || '')}&title=${encodeURIComponent(data.title)}&series=Pobreflix`; }; }
    const list = $('#mylist'); if (list && state.user) { const found = await state.client.from('favorites').select('title_id').eq('user_id', state.user.id).eq('title_id', id).maybeSingle(); list.textContent = found.data ? 'Na minha lista' : 'Minha lista'; list.onclick = async () => { const exists = list.textContent.includes('Na minha lista'); const result = exists ? await state.client.from('favorites').delete().eq('user_id', state.user.id).eq('title_id', id) : await state.client.from('favorites').insert({ user_id: state.user.id, title_id: id }); if (!result.error) list.textContent = exists ? 'Minha lista' : 'Na minha lista'; }; }
  };
  const bindLogout = () => all('[data-logout]').forEach(button => { if (button.dataset.pobreflixBound) return; button.dataset.pobreflixBound = 'true'; button.addEventListener('click', async () => { try { if (state.client) { const { error } = await state.client.auth.signOut(); if (error) return setMessage(friendlyError(error)); } location.href = 'index.html'; } catch (error) { setMessage(friendlyError(error)); } }); });
  const announceReady = () => { state.ready = true; window.pobreflix = { ...state, isAdmin, requireAdmin, getClient, friendlyError, setMessage, adminUid: ADMIN_UID, adminEmail: ADMIN_EMAIL }; window.dispatchEvent(new CustomEvent('pobreflix:ready', { detail: window.pobreflix })); };
  const boot = async () => {
    bindAuth(); bindLandingSignup(); bindSubscriptionGate(); bindContactForms(); bindProfilePersistence(); bindLogout(); showUserState();
    let config;
    try {
      const response = await fetch('/api/runtime-config', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Configuração indisponível (HTTP ${response.status}).`);
      config = await response.json(); state.config = config;
    } catch (error) {
      setMessage('Não foi possível carregar a configuração do serviço. Os formulários locais continuam disponíveis, mas operações no Supabase não funcionarão até a conexão ser restabelecida.'); console.warn('Configuração de runtime:', error); announceReady(); return;
    }
    if (!window.supabase?.createClient || !config?.supabaseUrl || !config?.supabaseAnonKey) {
      setMessage('Supabase ainda não foi configurado neste ambiente.'); announceReady(); return;
    }
    try {
      state.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      try { const { data, error } = await state.client.auth.getUser(); if (error) console.warn('Sessão Supabase:', friendlyError(error)); state.user = data?.user || null; }
      catch (error) { console.warn('Sessão Supabase:', friendlyError(error)); }
      state.client.auth.onAuthStateChange((_event, session) => { state.user = session?.user || null; state.profile = null; showUserState(); if (state.user) loadProfile().catch(error => console.warn('Perfil Supabase:', friendlyError(error))); });
      await applySeo().catch(error => console.warn('SEO Supabase:', friendlyError(error)));
      await loadProfile().catch(error => console.warn('Perfil Supabase:', friendlyError(error)));
      await loadPublishedTitles().catch(error => console.warn('Catálogo Supabase:', friendlyError(error)));
      await loadDbDetail().catch(error => console.warn('Detalhe Supabase:', friendlyError(error)));
      showUserState();
    } catch (error) {
      setMessage(`Não foi possível inicializar a conexão com o Supabase: ${friendlyError(error)}`); console.error(error);
    }
    announceReady();
  };
  document.addEventListener('DOMContentLoaded', boot);
})();
