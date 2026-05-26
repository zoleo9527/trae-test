from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Customer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('code', models.CharField(max_length=50, unique=True, verbose_name='客户编号')),
                ('name', models.CharField(max_length=200, verbose_name='客户名称')),
                ('type', models.CharField(choices=[('individual', '个人'), ('company', '企业')], default='individual', max_length=20, verbose_name='客户类型')),
                ('id_card', models.CharField(blank=True, max_length=50, null=True, verbose_name='身份证号')),
                ('company_name', models.CharField(blank=True, max_length=200, null=True, verbose_name='公司名称')),
                ('contact', models.CharField(max_length=50, verbose_name='联系人')),
                ('phone', models.CharField(max_length=20, verbose_name='联系电话')),
                ('address', models.TextField(blank=True, null=True, verbose_name='地址')),
                ('credit_limit', models.DecimalField(decimal_places=2, default=0, max_digits=12, verbose_name='赊账额度')),
                ('credit_level', models.CharField(choices=[('A', 'A级-优质'), ('B', 'B级-良好'), ('C', 'C级-一般'), ('D', 'D级-限制')], default='C', max_length=5, verbose_name='信用等级')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('remark', models.TextField(blank=True, null=True, verbose_name='备注')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_created', to='auth.user', verbose_name='创建人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_updated', to='auth.user', verbose_name='更新人')),
            ],
            options={
                'verbose_name': '客户',
                'verbose_name_plural': '客户',
                'db_table': 'customer',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='WasteType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('code', models.CharField(max_length=50, unique=True, verbose_name='废品编码')),
                ('name', models.CharField(max_length=100, verbose_name='废品名称')),
                ('category', models.CharField(blank=True, max_length=100, null=True, verbose_name='分类')),
                ('unit', models.CharField(default='kg', max_length=20, verbose_name='计量单位')),
                ('default_price', models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name='默认单价')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否启用')),
                ('remark', models.TextField(blank=True, null=True, verbose_name='备注')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='wastetype_created', to='auth.user', verbose_name='创建人')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='wastetype_updated', to='auth.user', verbose_name='更新人')),
            ],
            options={
                'verbose_name': '废品类型',
                'verbose_name_plural': '废品类型',
                'db_table': 'waste_type',
                'ordering': ['code'],
            },
        ),
    ]
