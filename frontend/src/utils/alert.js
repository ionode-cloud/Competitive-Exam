import Swal from 'sweetalert2';

export const alertSuccess = (title, text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: 'var(--primary)',
    customClass: {
      popup: 'glass',
    }
  });
};

export const alertError = (title, text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: 'var(--primary)',
    customClass: {
      popup: 'glass',
    }
  });
};

export const alertWarning = (title, text = '') => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonColor: 'var(--primary)',
    customClass: {
      popup: 'glass',
    }
  });
};

export const confirmAction = async (title, text = '', confirmButtonText = 'Yes, proceed', cancelButtonText = 'Cancel') => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    customClass: {
      popup: 'glass',
    }
  });
  return result.isConfirmed;
};
