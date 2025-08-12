# 🚀 **Quick Start: Vertex AI Integration**

## ⚡ **Get Started in 5 Minutes**

### **Step 1: Enable APIs (2 minutes)**
1. **Open**: https://console.cloud.google.com/
2. **Select Project**: `scholar-ai-1-prod`
3. **Go to**: APIs & Services → Library
4. **Search & Enable**:
   - `Vertex AI API`
   - `Vector Search API`

### **Step 2: Create Service Account (3 minutes)**
1. **Go to**: IAM & Admin → Service Accounts
2. **Click**: "Create Service Account"
3. **Name**: `scholar-ai-vertex`
4. **Roles**: 
   - `Vertex AI User`
   - `Vector Search User`
5. **Create Key**: JSON format
6. **Download**: Save the key file

---

## 🔑 **Essential Commands**

### **Test Current Function**
```bash
# Your function is already deployed and running!
# Endpoint: https://us-central1-scholar-ai-1-prod.cloudfunctions.net/realVertexAISearch
```

### **Check Function Status**
```bash
firebase functions:list
firebase functions:log --only realVertexAISearch
```

---

## 📱 **What to Do Next**

1. **Complete Phase 1** (APIs) - 5 minutes
2. **Complete Phase 2** (Service Account) - 10 minutes
3. **Let me know when ready** for Phase 3 (Configuration)

---

## 🆘 **Need Immediate Help?**

- **Function not working?** Check Firebase Console → Functions → Logs
- **Permission issues?** Verify service account roles
- **API errors?** Ensure APIs are enabled

---

**Start with Step 1 and let me know your progress!** 🚀
