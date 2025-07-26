// دوال الصلاحيات لتقارير التفاصيل

export async function checkUserPermissions(userId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("❌ No token found");
      return {
        full_access: false,
        add_items: false,
        edit_items: false,
        delete_items: false
      };
    }

    const response = await fetch('http://localhost:4000/check-permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const permissions = await response.json();
    console.log("✅ User permissions:", permissions);
    
    return {
      full_access: permissions.full_access || false,
      add_items: permissions.add_items || false,
      edit_items: permissions.edit_items || false,
      delete_items: permissions.delete_items || false
    };
  } catch (error) {
    console.error("❌ Error checking permissions:", error);
    return {
      full_access: false,
      add_items: false,
      edit_items: false,
      delete_items: false
    };
  }
} 