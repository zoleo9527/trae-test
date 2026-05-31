const mockUsers = [
  { id: "1", name: "\u5F20\u7ECF\u7406", role: "manager", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager" },
  { id: "2", name: "\u674E\u987E\u95EE", role: "consultant", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=consultant" },
  { id: "3", name: "\u738B\u6280\u5E08", role: "technician", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=technician" }
];
const mockPartInventory = [
  { id: "inv1", partCode: "MOV-001", partName: "\u673A\u82AF\u8F74\u627F\u7EC4\u4EF6", stock: 15, locked: 3, unit: "\u5957", price: 680 },
  { id: "inv2", partCode: "MOV-002", partName: "\u64D2\u7EB5\u673A\u6784", stock: 8, locked: 2, unit: "\u5957", price: 1280 },
  { id: "inv3", partCode: "CAS-001", partName: "\u8868\u51A0\u5BC6\u5C01\u5708", stock: 50, locked: 5, unit: "\u4E2A", price: 45 },
  { id: "inv4", partCode: "CAS-002", partName: "\u84DD\u5B9D\u77F3\u8868\u955C 40mm", stock: 12, locked: 1, unit: "\u7247", price: 380 },
  { id: "inv5", partCode: "STR-001", partName: "\u4E0D\u9508\u94A2\u8868\u5E26 20mm", stock: 20, locked: 2, unit: "\u6761", price: 450 },
  { id: "inv6", partCode: "STR-002", partName: "\u771F\u76AE\u8868\u5E26 20mm", stock: 25, locked: 0, unit: "\u6761", price: 280 },
  { id: "inv7", partCode: "BAT-001", partName: "\u624B\u8868\u7535\u6C60 SR920SW", stock: 100, locked: 0, unit: "\u7C92", price: 35 },
  { id: "inv8", partCode: "LUB-001", partName: "\u673A\u82AF\u6DA6\u6ED1\u6CB9", stock: 30, locked: 0, unit: "\u74F6", price: 120 }
];
function createTimelineEntry(id, action, operator, operatorRole, remark, offsetHours = 0, baseTime) {
  const time = baseTime ? new Date(baseTime.getTime() + offsetHours * 36e5) : new Date(Date.now() + offsetHours * 36e5);
  return {
    id,
    action,
    operator,
    operatorRole,
    remark,
    createdAt: time.toISOString()
  };
}
function createProgressEntry(id, workOrderId, status, description, operator, operatorRole, offsetHours, baseTime) {
  return {
    id,
    workOrderId,
    status,
    description,
    operator,
    operatorRole,
    createdAt: new Date(baseTime.getTime() + offsetHours * 36e5).toISOString()
  };
}
function createReceipt(workOrderId, confirmed, pickedUp, satisfaction) {
  return {
    id: `receipt-${workOrderId}`,
    workOrderId,
    confirmed,
    pickedUp,
    satisfaction
  };
}
function createMockWorkOrders() {
  const customers = [
    { id: "c1", name: "\u9648\u5148\u751F", phone: "13800138001", email: "chen@example.com", address: "\u5317\u4EAC\u5E02\u671D\u9633\u533A\u5EFA\u56FD\u8DEF88\u53F7" },
    { id: "c2", name: "\u5218\u5973\u58EB", phone: "13900139002", email: "liu@example.com", address: "\u4E0A\u6D77\u5E02\u6D66\u4E1C\u65B0\u533A\u9646\u5BB6\u5634\u73AF\u8DEF" },
    { id: "c3", name: "\u738B\u5148\u751F", phone: "13700137003", email: "wang@example.com", address: "\u5E7F\u5DDE\u5E02\u5929\u6CB3\u533A\u73E0\u6C5F\u65B0\u57CE" },
    { id: "c4", name: "\u8D75\u5973\u58EB", phone: "13600136004", email: "zhao@example.com", address: "\u6DF1\u5733\u5E02\u5357\u5C71\u533A\u79D1\u6280\u56ED" },
    { id: "c5", name: "\u5B59\u5148\u751F", phone: "13500135005", email: "sun@example.com", address: "\u676D\u5DDE\u5E02\u897F\u6E56\u533A\u6587\u4E09\u8DEF" },
    { id: "c6", name: "\u5468\u5973\u58EB", phone: "13400134006", email: "zhou@example.com", address: "\u6210\u90FD\u5E02\u6B66\u4FAF\u533A\u5929\u5E9C\u5927\u9053" }
  ];
  const watches = [
    { brand: "\u52B3\u529B\u58EB", model: "\u6F5C\u822A\u8005\u578B", serial: "SN12345678" },
    { brand: "\u6B27\u7C73\u8304", model: "\u6D77\u9A6C\u7CFB\u5217", serial: "SN87654321" },
    { brand: "\u5361\u5730\u4E9A", model: "\u84DD\u6C14\u7403", serial: "SN23456789" },
    { brand: "\u4E07\u56FD", model: "\u8461\u8404\u7259\u7CFB\u5217", serial: "SN98765432" },
    { brand: "\u6D6A\u7434", model: "\u540D\u5320\u7CFB\u5217", serial: "SN34567890" },
    { brand: "\u5929\u68AD", model: "\u529B\u6D1B\u514B", serial: "SN09876543" },
    { brand: "\u7F8E\u5EA6", model: "\u8D1D\u4F26\u8D5B\u4E3D", serial: "SN45678901" },
    { brand: "\u6885\u82B1", model: "\u5B87\u5B99\u7CFB\u5217", serial: "SN10987654" },
    { brand: "\u7CBE\u5DE5", model: "Presage", serial: "SN56789012" }
  ];
  const problems = [
    "\u8D70\u65F6\u4E0D\u51C6\uFF0C\u6BCF\u5929\u5FEB\u7EA65\u5206\u949F",
    "\u8868\u51A0\u65E0\u6CD5\u6B63\u5E38\u65CB\u5165\uFF0C\u9632\u6C34\u6027\u80FD\u53D7\u635F",
    "\u8868\u76D8\u8FDB\u6C34\u8D77\u96FE\uFF0C\u9700\u8981\u6E05\u6D17\u4FDD\u517B",
    "\u81EA\u52A8\u4E0A\u94FE\u6548\u7387\u4F4E\u4E0B\uFF0C\u624B\u52A8\u4E0A\u94FE\u6B63\u5E38",
    "\u8868\u5E26\u6263\u635F\u574F\uFF0C\u9700\u8981\u66F4\u6362",
    "\u8868\u955C\u522E\u82B1\uFF0C\u5F71\u54CD\u7F8E\u89C2",
    "\u9700\u8981\u5168\u9762\u4FDD\u517B\u6D17\u6CB9\uFF0C\u8D2D\u4E705\u5E74\u672A\u4FDD\u517B",
    "\u591C\u5149\u6D82\u5C42\u8131\u843D\uFF0C\u9700\u8981\u91CD\u6D82",
    "\u8BA1\u65F6\u529F\u80FD\u5931\u7075\uFF0C\u6309\u94AE\u65E0\u53CD\u5E94",
    "\u65E5\u5386\u8DF3\u8F6C\u5F02\u5E38\uFF0C\u4E2D\u534812\u70B9\u8DF3\u8F6C"
  ];
  const inspectionResults = [
    "\u7ECF\u68C0\u6D4B\uFF0C\u673A\u82AF\u6446\u5E45\u504F\u4F4E\uFF0C\u9700\u8981\u6E05\u6D17\u4FDD\u517B\u5E76\u66F4\u6362\u78E8\u635F\u9F7F\u8F6E",
    "\u8868\u51A0\u87BA\u7EB9\u78E8\u635F\uFF0C\u9700\u8981\u66F4\u6362\u8868\u51A0\u53CA\u9632\u6C34\u5708",
    "\u8FDB\u6C34\u60C5\u51B5\u8F83\u8F7B\uFF0C\u673A\u82AF\u672A\u751F\u9508\uFF0C\u6E05\u6D17\u70D8\u5E72\u5373\u53EF",
    "\u81EA\u52A8\u9640\u8F74\u627F\u78E8\u635F\uFF0C\u9700\u8981\u66F4\u6362\u8F74\u627F\u7EC4\u4EF6",
    "\u8868\u6263\u5F39\u7C27\u65AD\u88C2\uFF0C\u9700\u8981\u66F4\u6362\u8868\u6263",
    "\u8868\u955C\u5212\u75D5\u8F83\u6DF1\uFF0C\u9700\u8981\u66F4\u6362\u84DD\u5B9D\u77F3\u8868\u955C",
    "\u673A\u82AF\u6CB9\u6CE5\u4E25\u91CD\uFF0C\u9700\u8981\u5168\u9762\u62C6\u6D17\u52A0\u6CB9",
    "\u591C\u5149\u6D82\u5C42\u8001\u5316\uFF0C\u9700\u8981\u91CD\u65B0\u6D82\u8986\u591C\u5149\u6750\u6599",
    "\u8BA1\u65F6\u9F7F\u8F6E\u7EC4\u5361\u6EDE\uFF0C\u9700\u8981\u6E05\u7406\u6DA6\u6ED1",
    "\u65E5\u5386\u62E8\u8F6E\u9519\u4F4D\uFF0C\u9700\u8981\u91CD\u65B0\u5B89\u88C5\u8C03\u6574"
  ];
  const statuses = [
    { status: "pending_review", timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: "quoting", timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_approval", timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "rejected", timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_confirm", timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "customer_rejected", timelineSteps: 7, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 3, receipt: { confirmed: true, pickedUp: false } },
    { status: "completed", timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } },
    { status: "picked_up", timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 5 } },
    { status: "picked_up", timelineSteps: 12, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: true, satisfaction: 4 } },
    { status: "pending_approval", timelineSteps: 4, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "pending_confirm", timelineSteps: 6, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "repairing", timelineSteps: 8, hasQuote: true, hasParts: true, hasProgress: 4, receipt: { confirmed: true, pickedUp: false } },
    { status: "pending_review", timelineSteps: 1, hasQuote: false, hasParts: false, hasProgress: 0, receipt: { confirmed: false, pickedUp: false } },
    { status: "quoting", timelineSteps: 3, hasQuote: false, hasParts: true, hasProgress: 1, receipt: { confirmed: false, pickedUp: false } },
    { status: "rejected", timelineSteps: 5, hasQuote: true, hasParts: true, hasProgress: 2, receipt: { confirmed: false, pickedUp: false } },
    { status: "completed", timelineSteps: 10, hasQuote: true, hasParts: true, hasProgress: 5, receipt: { confirmed: true, pickedUp: false } }
  ];
  const priorities = ["low", "medium", "high", "urgent"];
  const partConfigs = [
    [{ partName: "\u673A\u82AF\u8F74\u627F\u7EC4\u4EF6", partCode: "MOV-001", quantity: 1 }],
    [{ partName: "\u64D2\u7EB5\u673A\u6784", partCode: "MOV-002", quantity: 1 }],
    [{ partName: "\u8868\u51A0\u5BC6\u5C01\u5708", partCode: "CAS-001", quantity: 2 }],
    [{ partName: "\u84DD\u5B9D\u77F3\u8868\u955C 40mm", partCode: "CAS-002", quantity: 1 }],
    [{ partName: "\u4E0D\u9508\u94A2\u8868\u5E26 20mm", partCode: "STR-001", quantity: 1 }],
    [{ partName: "\u673A\u82AF\u6DA6\u6ED1\u6CB9", partCode: "LUB-001", quantity: 1 }]
  ];
  const now = /* @__PURE__ */ new Date();
  const workOrders = [];
  for (let i = 0; i < 18; i++) {
    const customer = customers[i % customers.length];
    const watch = watches[i % watches.length];
    const problem = problems[i % problems.length];
    const inspectionResult = inspectionResults[i % inspectionResults.length];
    const statusConfig = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const partConfig = partConfigs[i % partConfigs.length];
    const daysAgo = Math.floor(Math.random() * 14);
    const receivedAt = new Date(now.getTime() - daysAgo * 864e5);
    const timeline = [];
    const progress = [];
    let parts = [];
    let quote;
    const timelines = [
      createTimelineEntry(`tl${i}-1`, "\u5BC4\u4FEE\u767B\u8BB0", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u9001\u4FEE\uFF0C\u5DF2\u767B\u8BB0\u57FA\u672C\u4FE1\u606F", 0, receivedAt),
      createTimelineEntry(`tl${i}-2`, "\u5F00\u59CB\u68C0\u6D4B", "\u738B\u6280\u5E08", "technician", "\u5DF2\u63A5\u6536\u624B\u8868\uFF0C\u5F00\u59CB\u68C0\u6D4B", 2, receivedAt),
      createTimelineEntry(`tl${i}-3`, "\u68C0\u6D4B\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", inspectionResult, 6, receivedAt),
      createTimelineEntry(`tl${i}-4`, "\u9501\u5B9A\u914D\u4EF6", "\u738B\u6280\u5E08", "technician", "\u5DF2\u9501\u5B9A\u6240\u9700\u7EF4\u4FEE\u914D\u4EF6", 7, receivedAt),
      createTimelineEntry(`tl${i}-5`, "\u63D0\u4EA4\u62A5\u4EF7", "\u738B\u6280\u5E08", "technician", "", 8, receivedAt),
      createTimelineEntry(`tl${i}-6`, "\u5BA1\u6279\u901A\u8FC7", "\u5F20\u7ECF\u7406", "manager", "\u62A5\u4EF7\u5408\u7406\uFF0C\u540C\u610F", 10, receivedAt),
      createTimelineEntry(`tl${i}-7`, "\u53D1\u9001\u5BA2\u6237\u786E\u8BA4", "\u674E\u987E\u95EE", "consultant", "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u53D1\u9001\u62A5\u4EF7\u786E\u8BA4", 12, receivedAt),
      createTimelineEntry(`tl${i}-8`, "\u5BA2\u6237\u786E\u8BA4", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u7535\u8BDD\u786E\u8BA4\u540C\u610F\u7EF4\u4FEE", 24, receivedAt),
      createTimelineEntry(`tl${i}-9`, "\u5F00\u59CB\u7EF4\u4FEE", "\u738B\u6280\u5E08", "technician", "\u5F00\u59CB\u6267\u884C\u7EF4\u4FEE\u5DE5\u4F5C", 26, receivedAt),
      createTimelineEntry(`tl${i}-10`, "\u7EF4\u4FEE\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", "\u7EF4\u4FEE\u5B8C\u6210\uFF0C\u68C0\u6D4B\u901A\u8FC7", 72, receivedAt),
      createTimelineEntry(`tl${i}-11`, "\u901A\u77E5\u53D6\u4EF6", "\u674E\u987E\u95EE", "consultant", "\u5DF2\u901A\u8FC7\u77ED\u4FE1\u901A\u77E5\u5BA2\u6237\u53D6\u4EF6", 74, receivedAt),
      createTimelineEntry(`tl${i}-12`, "\u5BA2\u6237\u53D6\u4EF6", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u5DF2\u53D6\u8868", 96, receivedAt)
    ];
    if (statusConfig.status === "rejected") {
      timelines[5] = createTimelineEntry(`tl${i}-6`, "\u5BA1\u6279\u9A73\u56DE", "\u5F20\u7ECF\u7406", "manager", "\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6838\u7B97", 10, receivedAt);
    }
    if (statusConfig.status === "customer_rejected") {
      timelines[7] = createTimelineEntry(`tl${i}-8`, "\u5BA2\u6237\u9A73\u56DE", "\u674E\u987E\u95EE", "consultant", "\u5BA2\u6237\u8BA4\u4E3A\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u4E0D\u540C\u610F\u7EF4\u4FEE", 24, receivedAt);
    }
    for (let j = 0; j < statusConfig.timelineSteps; j++) {
      timeline.push(timelines[j]);
    }
    if (statusConfig.hasParts) {
      parts = partConfig.map((p, idx) => ({
        id: `pl${i}-${idx}`,
        partName: p.partName,
        partCode: p.partCode,
        quantity: p.quantity,
        status: statusConfig.status === "rejected" || statusConfig.status === "customer_rejected" ? "released" : "locked",
        lockedBy: "3",
        lockedAt: new Date(receivedAt.getTime() + 7 * 36e5).toISOString()
      }));
    }
    if (statusConfig.hasQuote) {
      const partsCost = partConfig.reduce((sum, p) => {
        const inv = mockPartInventory.find((i2) => i2.partCode === p.partCode);
        return sum + ((inv == null ? void 0 : inv.price) || 0) * p.quantity;
      }, 0);
      const laborCost = 300 + Math.floor(Math.random() * 1500);
      const amount = partsCost + laborCost;
      quote = {
        id: `q${i}`,
        workOrderId: `wo${i + 1}`,
        amount,
        partsCost,
        laborCost,
        status: statusConfig.status === "rejected" || statusConfig.status === "customer_rejected" ? "rejected" : statusConfig.status === "pending_approval" || statusConfig.status === "pending_confirm" ? "submitted" : "approved",
        remark: inspectionResult,
        createdAt: new Date(receivedAt.getTime() + 8 * 36e5).toISOString(),
        approvedAt: statusConfig.status !== "rejected" && statusConfig.status !== "pending_approval" && statusConfig.status !== "quoting" && statusConfig.status !== "pending_review" ? new Date(receivedAt.getTime() + 10 * 36e5).toISOString() : void 0
      };
      if (timeline.length > 4) {
        timeline[4].remark = `\u62A5\u4EF7\u91D1\u989D: \xA5${amount}`;
      }
    }
    if (statusConfig.hasProgress > 0) {
      const progressSteps = [
        createProgressEntry(`pg${i}-1`, `wo${i + 1}`, "inspecting", "\u68C0\u6D4B\u624B\u8868\u6545\u969C\uFF0C\u8BC4\u4F30\u7EF4\u4FEE\u65B9\u6848", "\u738B\u6280\u5E08", "technician", 2, receivedAt),
        createProgressEntry(`pg${i}-2`, `wo${i + 1}`, "parts_preparing", "\u51C6\u5907\u7EF4\u4FEE\u6240\u9700\u914D\u4EF6", "\u738B\u6280\u5E08", "technician", 7, receivedAt),
        createProgressEntry(`pg${i}-3`, `wo${i + 1}`, "repairing", "\u62C6\u89E3\u673A\u82AF\uFF0C\u6E05\u6D17\u66F4\u6362\u78E8\u635F\u96F6\u4EF6", "\u738B\u6280\u5E08", "technician", 26, receivedAt),
        createProgressEntry(`pg${i}-4`, `wo${i + 1}`, "testing", "\u7EC4\u88C5\u5B8C\u6210\uFF0C\u8FDB\u884C\u7CBE\u5EA6\u6D4B\u8BD5", "\u738B\u6280\u5E08", "technician", 60, receivedAt),
        createProgressEntry(`pg${i}-5`, `wo${i + 1}`, "completed", "\u68C0\u6D4B\u901A\u8FC7\uFF0C\u7EF4\u4FEE\u5B8C\u6210", "\u738B\u6280\u5E08", "technician", 72, receivedAt)
      ];
      for (let j = 0; j < statusConfig.hasProgress; j++) {
        progress.push(progressSteps[j]);
      }
    }
    const receipt = statusConfig.receipt.confirmed || statusConfig.receipt.pickedUp ? createReceipt(`wo${i + 1}`, statusConfig.receipt.confirmed, statusConfig.receipt.pickedUp, statusConfig.receipt.satisfaction) : void 0;
    if (receipt && statusConfig.receipt.pickedUp) {
      receipt.pickedUpAt = new Date(receivedAt.getTime() + 96 * 36e5).toISOString();
      receipt.pickedUpBy = customer.name;
      receipt.confirmedAt = new Date(receivedAt.getTime() + 24 * 36e5).toISOString();
      receipt.confirmedBy = customer.name;
      if (receipt.satisfaction) {
        receipt.satisfactionAt = new Date(receivedAt.getTime() + 100 * 36e5).toISOString();
        receipt.satisfactionComment = receipt.satisfaction >= 5 ? "\u7EF4\u4FEE\u8D28\u91CF\u5F88\u597D\uFF0C\u8D70\u65F6\u51C6\u786E\uFF0C\u670D\u52A1\u6001\u5EA6\u597D" : "\u6574\u4F53\u6EE1\u610F\uFF0C\u5C31\u662F\u7EF4\u4FEE\u65F6\u95F4\u6709\u70B9\u957F";
      }
    }
    const order = {
      id: `wo${i + 1}`,
      orderNo: `WS${String(now.getFullYear()).slice(-2)}${String(1001 + i).padStart(4, "0")}`,
      customer,
      watchBrand: watch.brand,
      watchModel: watch.model,
      watchSerial: watch.serial,
      problemDesc: problem,
      inspectionResult: statusConfig.timelineSteps > 2 ? inspectionResult : void 0,
      status: statusConfig.status,
      priority,
      receivedAt: receivedAt.toISOString(),
      expectedDate: statusConfig.status !== "completed" && statusConfig.status !== "picked_up" ? new Date(receivedAt.getTime() + 7 * 864e5).toISOString() : void 0,
      quote,
      parts,
      timeline,
      progress,
      receipt,
      assignedTo: "3",
      createdBy: "2",
      createdAt: receivedAt.toISOString(),
      updatedAt: timeline.length > 0 ? timeline[timeline.length - 1].createdAt : receivedAt.toISOString(),
      rejectReason: statusConfig.status === "rejected" ? "\u62A5\u4EF7\u8FC7\u9AD8\uFF0C\u5EFA\u8BAE\u91CD\u65B0\u6838\u7B97\u96F6\u4EF6\u6210\u672C" : void 0,
      customerRejectReason: statusConfig.status === "customer_rejected" ? "\u5BA2\u6237\u8BA4\u4E3A\u7EF4\u4FEE\u8D39\u7528\u8D85\u8FC7\u624B\u8868\u6B8B\u503C" : void 0
    };
    workOrders.push(order);
  }
  return workOrders;
}
let mockWorkOrders = createMockWorkOrders();
function getDashboardStats() {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const pendingStatuses = ["pending_review", "quoting", "pending_approval", "pending_confirm", "repairing"];
  const rejectedStatuses = ["rejected", "customer_rejected"];
  const weekAgo = new Date(today.getTime() - 7 * 864e5);
  const completedThisWeek = mockWorkOrders.filter(
    (wo) => (wo.status === "completed" || wo.status === "picked_up") && new Date(wo.updatedAt) >= weekAgo
  ).length;
  const totalProcessTime = mockWorkOrders.filter((wo) => wo.status === "picked_up").reduce((sum, wo) => {
    const start = new Date(wo.createdAt).getTime();
    const end = new Date(wo.updatedAt).getTime();
    return sum + (end - start) / (1e3 * 60 * 60 * 24);
  }, 0);
  const avgProcessTime = mockWorkOrders.filter((wo) => wo.status === "picked_up").length > 0 ? Math.round(totalProcessTime / mockWorkOrders.filter((wo) => wo.status === "picked_up").length * 10) / 10 : 0;
  const needSatisfactionSurvey = mockWorkOrders.filter(
    (wo) => {
      var _a;
      return wo.status === "picked_up" && (!((_a = wo.receipt) == null ? void 0 : _a.satisfaction) || wo.receipt.satisfaction === 0);
    }
  ).length;
  return {
    pending: mockWorkOrders.filter((wo) => pendingStatuses.includes(wo.status)).length,
    rejected: mockWorkOrders.filter((wo) => rejectedStatuses.includes(wo.status)).length,
    needReview: mockWorkOrders.filter((wo) => wo.status === "pending_approval").length,
    todayNew: mockWorkOrders.filter((wo) => new Date(wo.createdAt) >= today).length,
    completedThisWeek,
    avgProcessTime,
    needFollowUp: needSatisfactionSurvey
  };
}

export { mockUsers as a, mockWorkOrders as b, getDashboardStats as g, mockPartInventory as m };
//# sourceMappingURL=mockData.mjs.map
