# Generated migration for adding time_voted field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('voters', '0002_voter_status_deleted'),
    ]

    operations = [
        migrations.AddField(
            model_name='voter',
            name='time_voted',
            field=models.DateTimeField(blank=True, help_text='Timestamp when voter was marked as voted', null=True, verbose_name='Time Voted'),
        ),
    ]
