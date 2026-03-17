// 登录表单验证逻辑

// 用户名验证规则
function validateUsername(username) {
  // 检查是否为空
  if (!username || username.trim() === '') {
    return {
      isValid: false,
      errorMessage: '用户名不能为空'
    };
  }

  // 检查最小长度
  if (username.trim().length < 3) {
    return {
      isValid: false,
      errorMessage: '用户名至少需要3个字符'
    };
  }

  // 检查最大长度
  if (username.trim().length > 20) {
    return {
      isValid: false,
      errorMessage: '用户名不能超过20个字符'
    };
  }

  // 检查格式（只允许字母、数字、下划线）
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username.trim())) {
    return {
      isValid: false,
      errorMessage: '用户名只能包含字母、数字和下划线'
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
}

// 密码验证规则
function validatePassword(password) {
  // 检查是否为空
  if (!password || password === '') {
    return {
      isValid: false,
      errorMessage: '密码不能为空'
    };
  }

  // 检查最小长度
  if (password.length < 6) {
    return {
      isValid: false,
      errorMessage: '密码至少需要6个字符'
    };
  }

  // 检查最大长度
  if (password.length > 50) {
    return {
      isValid: false,
      errorMessage: '密码不能超过50个字符'
    };
  }

  // 检查复杂度（至少包含一个字母和一个数字）
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      errorMessage: '密码必须包含字母和数字'
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
}

// 显示错误消息
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  const inputElement = document.getElementById(elementId.replace('Error', ''));

  if (errorElement) {
    errorElement.textContent = message;
  }

  if (inputElement && message) {
    inputElement.classList.add('error');
    inputElement.classList.remove('valid');
  }
}

// 清除错误消息
function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  const inputElement = document.getElementById(elementId.replace('Error', ''));

  if (errorElement) {
    errorElement.textContent = '';
  }

  if (inputElement) {
    inputElement.classList.remove('error');
  }
}

// 显示输入框有效状态
function showValid(elementId) {
  const inputElement = document.getElementById(elementId);

  if (inputElement) {
    inputElement.classList.remove('error');
    inputElement.classList.add('valid');
  }
}

// 显示/隐藏表单错误
function showFormError(message) {
  const formError = document.getElementById('formError');
  if (formError) {
    formError.textContent = message;
  }
}

function clearFormError() {
  const formError = document.getElementById('formError');
  if (formError) {
    formError.textContent = '';
  }
}

// 显示成功消息
function showSuccessMessage(message) {
  const successElement = document.getElementById('successMessage');
  if (successElement) {
    successElement.textContent = message;
    successElement.classList.add('visible');
  }
}

function clearSuccessMessage() {
  const successElement = document.getElementById('successMessage');
  if (successElement) {
    successElement.classList.remove('visible');
  }
}

// 模拟登录
async function performLogin(username, password) {
  // 显示加载状态
  const loginBtn = document.getElementById('loginBtn');
  const originalText = loginBtn.textContent;
  loginBtn.disabled = true;
  loginBtn.textContent = '登录中...';

  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 模拟登录验证（实际项目中应该调用后端 API）
  const isValidCredentials = username === 'admin' && password === 'admin123';

  // 恢复按钮状态
  loginBtn.disabled = false;
  loginBtn.textContent = originalText;

  return isValidCredentials;
}

// 表单提交处理
async function handleFormSubmit(event) {
  event.preventDefault();
  clearFormError();
  clearSuccessMessage();

  // 获取表单值
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const username = usernameInput?.value || '';
  const password = passwordInput?.value || '';

  // 验证用户名
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    showError('usernameError', usernameValidation.errorMessage);
    usernameInput?.focus();
    return;
  } else {
    clearError('usernameError');
    showValid('username');
  }

  // 验证密码
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showError('passwordError', passwordValidation.errorMessage);
    passwordInput?.focus();
    return;
  } else {
    clearError('passwordError');
    showValid('password');
  }

  // 执行登录
  const loginSuccess = await performLogin(username, password);

  if (loginSuccess) {
    showSuccessMessage('登录成功！欢迎回来，' + username + '。');
    // 实际项目中可以在这里跳转到其他页面
    console.log('登录成功:', { username });
  } else {
    showFormError('用户名或密码错误，请重试。');
  }
}

// 实时验证（输入时）
function handleInputValidation(event) {
  const target = event.target;
  const fieldName = target.id;

  if (fieldName === 'username') {
    const validation = validateUsername(target.value);
    if (target.value.trim() !== '') {
      if (validation.isValid) {
        clearError('usernameError');
        showValid('username');
      } else {
        showError('usernameError', validation.errorMessage);
      }
    } else {
      clearError('usernameError');
      target.classList.remove('valid');
    }
  }

  if (fieldName === 'password') {
    const validation = validatePassword(target.value);
    if (target.value !== '') {
      if (validation.isValid) {
        clearError('passwordError');
        showValid('password');
      } else {
        showError('passwordError', validation.errorMessage);
      }
    } else {
      clearError('passwordError');
      target.classList.remove('valid');
    }
  }
}

// 初始化
function init() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // 绑定表单提交事件
  loginForm?.addEventListener('submit', handleFormSubmit);

  // 绑定实时验证事件
  usernameInput?.addEventListener('input', handleInputValidation);
  passwordInput?.addEventListener('input', handleInputValidation);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
