from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
from app.models.gallery import Gallery
from app.models.citizen import Citizen, CitizenReport
from app.models.alert import Alert
from app.models.user import User

class AIReportService:
    """Service for generating AI-powered reports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_summary_report(self, period: str = "monthly") -> Dict[str, Any]:
        """Generate summary report with statistics"""
        
        try:
            # Calculate date range
            end_date = datetime.now()
            if period == "daily":
                start_date = end_date - timedelta(days=1)
            elif period == "weekly":
                start_date = end_date - timedelta(days=7)
            elif period == "monthly":
                start_date = end_date - timedelta(days=30)
            elif period == "yearly":
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=30)
            
            # Get data
            total_persons = self.db.query(Gallery).count()
            missing_persons = self.db.query(Gallery).filter(Gallery.status == "missing").count()
            found_persons = self.db.query(Gallery).filter(Gallery.status == "found").count()
            wanted_persons = self.db.query(Gallery).filter(Gallery.status == "wanted").count()
            
            new_cases = self.db.query(Gallery).filter(
                Gallery.created_at >= start_date
            ).count()
            
            resolved_cases = self.db.query(Gallery).filter(
                Gallery.status == "found",
                Gallery.created_at >= start_date
            ).count()
            
            # FIX: Citizen reports are alerts that are NOT public announcements
            citizen_reports = self.db.query(Alert).filter(Alert.is_public == False).count()
            # Total alerts (including public announcements)
            alerts = self.db.query(Alert).count()
            active_citizens = self.db.query(Citizen).filter(Citizen.is_active == True).count()
            
            # Calculate resolution rate
            resolution_rate = (resolved_cases / new_cases * 100) if new_cases > 0 else 0
            
            # Generate AI insights
            insights = self._generate_insights({
                "total_persons": total_persons,
                "missing_persons": missing_persons,
                "found_persons": found_persons,
                "new_cases": new_cases,
                "resolved_cases": resolved_cases,
                "resolution_rate": resolution_rate
            })
            
            report = {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "generated_at": end_date.isoformat(),
                "statistics": {
                    "total_persons": total_persons,
                    "missing_persons": missing_persons,
                    "found_persons": found_persons,
                    "wanted_persons": wanted_persons,
                    "new_cases": new_cases,
                    "resolved_cases": resolved_cases,
                    "resolution_rate": round(resolution_rate, 2),
                    "citizen_reports": citizen_reports,
                    "alerts": alerts,
                    "active_citizens": active_citizens
                },
                "insights": insights,
                "trends": self._get_trends(start_date, end_date)
            }
            
            return report
        except Exception as e:
            print(f"Error in generate_summary_report: {e}")
            return {
                "period": period,
                "error": str(e),
                "statistics": {},
                "insights": ["Unable to generate report at this time"],
                "trends": []
            }
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate system performance report"""
        
        try:
            total_users = self.db.query(User).count()
            admin_users = self.db.query(User).filter(User.role == "admin").count()
            detective_users = self.db.query(User).filter(User.role == "detective").count()
            operator_users = self.db.query(User).filter(User.role == "operator").count()
            
            total_citizens = self.db.query(Citizen).count()
            active_citizens = self.db.query(Citizen).filter(Citizen.is_active == True).count()
            
            total_reports = self.db.query(CitizenReport).count()
            verified_reports = self.db.query(CitizenReport).filter(CitizenReport.status == "verified").count()
            pending_reports = self.db.query(CitizenReport).filter(CitizenReport.status == "pending").count()
            
            verification_rate = round((verified_reports / total_reports * 100) if total_reports > 0 else 0, 2)
            
            report = {
                "users": {
                    "total": total_users,
                    "admin": admin_users,
                    "detective": detective_users,
                    "operator": operator_users
                },
                "citizens": {
                    "total": total_citizens,
                    "active": active_citizens,
                    "inactive": total_citizens - active_citizens
                },
                "reports": {
                    "total": total_reports,
                    "verified": verified_reports,
                    "pending": pending_reports,
                    "verification_rate": verification_rate
                },
                "recommendations": self._get_recommendations()
            }
            
            return report
        except Exception as e:
            print(f"Error in generate_performance_report: {e}")
            return {
                "error": str(e),
                "users": {},
                "citizens": {},
                "reports": {},
                "recommendations": ["Unable to generate performance report"]
            }
    
    def generate_person_report(self, person_id: int) -> Dict[str, Any]:
        """Generate detailed report for a specific person"""
        
        try:
            person = self.db.query(Gallery).filter(Gallery.id == person_id).first()
            if not person:
                return {"error": "Person not found"}
            
            reports = self.db.query(CitizenReport).filter(
                CitizenReport.gallery_id == person_id
            ).order_by(CitizenReport.reported_at.desc()).all()
            
            alerts = self.db.query(Alert).filter(
                Alert.person_id == person_id
            ).order_by(Alert.created_at.desc()).all()
            
            report = {
                "person": {
                    "id": person.id,
                    "name": person.name,
                    "status": person.status,
                    "description": person.description,
                    "id_number": person.id_number,
                    "phone": person.phone,
                    "residence_location": person.residence_location,
                    "photo_location": person.photo_location,
                    "station_added": person.station_added,
                    "birth_date": person.birth_date.isoformat() if person.birth_date else None,
                    "additional_info": person.additional_info,
                    "created_at": person.created_at.isoformat()
                },
                "reports_count": len(reports),
                "alerts_count": len(alerts),
                "recent_reports": [
                    {
                        "id": r.id,
                        "description": r.description[:100] if r.description else "",
                        "location": r.location_name,
                        "reported_at": r.reported_at.isoformat(),
                        "status": r.status
                    } for r in reports[:10]
                ],
                "ai_analysis": self._analyze_person_case(person, reports)
            }
            
            return report
        except Exception as e:
            print(f"Error in generate_person_report: {e}")
            return {"error": str(e)}
    
    def export_to_pdf(self, report_data: Dict[str, Any], report_type: str = "summary") -> bytes:
        """Export report to PDF with full data (safe version)"""
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
        
        import io
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#ffd700'),
            alignment=1,
            spaceAfter=30
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#ff8c00'),
            spaceAfter=12,
            spaceBefore=20
        )
        
        story = []
        
        # Title
        title = f"AI Report - {report_type.upper()}"
        story.append(Paragraph(title, title_style))
        story.append(Spacer(1, 12))
        
        # Date
        date_str = f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        story.append(Paragraph(date_str, styles['Normal']))
        story.append(Spacer(1, 24))
        
        # Statistics (only for summary report)
        if report_type == "summary" and report_data.get("statistics") and isinstance(report_data["statistics"], dict):
            story.append(Paragraph("📊 Statistics", heading_style))
            
            data = [["Metric", "Value"]]
            for key, value in report_data["statistics"].items():
                display_key = key.replace("_", " ").title()
                data.append([display_key, str(value)])
            
            table = Table(data, colWidths=[250, 100])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ffd700')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(table)
            story.append(Spacer(1, 20))
            
            # Period info
            if report_data.get("start_date") and report_data.get("end_date"):
                start = report_data["start_date"][:10]
                end = report_data["end_date"][:10]
                story.append(Paragraph(f"Period: {start} to {end}", styles['Normal']))
                story.append(Spacer(1, 20))
        
        # AI Insights
        if report_data.get("insights") and isinstance(report_data["insights"], list):
            story.append(Paragraph("🤖 AI Insights", heading_style))
            for insight in report_data["insights"]:
                story.append(Paragraph(f"• {insight}", styles['Normal']))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 20))
        
        # Recommendations (for performance report)
        if report_data.get("recommendations") and isinstance(report_data["recommendations"], list):
            story.append(Paragraph("📋 Recommendations", heading_style))
            for rec in report_data["recommendations"]:
                story.append(Paragraph(f"• {rec}", styles['Normal']))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 20))
        
        # Trends - only if data exists and is non-empty
        trends = report_data.get("trends")
        if trends and isinstance(trends, list) and len(trends) > 0:
            story.append(Paragraph("📈 Trends", heading_style))
            # Limit to last 7 days or all
            recent_trends = trends[-7:] if len(trends) > 7 else trends
            
            # Build table only if we have valid trend items
            if recent_trends:
                trend_data = [["Date", "New Missing", "Reports"]]
                for trend in recent_trends:
                    if isinstance(trend, dict):
                        date_val = trend.get("date", "Unknown")
                        missing_val = str(trend.get("new_missing", 0))
                        reports_val = str(trend.get("reports", 0))
                        trend_data.append([date_val, missing_val, reports_val])
                
                if len(trend_data) > 1:  # at least one data row
                    trend_table = Table(trend_data, colWidths=[100, 80, 80])
                    trend_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ffd700')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('FONTSIZE', (0, 1), (-1, -1), 9),
                        ('PADDING', (0, 0), (-1, -1), 4),
                    ]))
                    story.append(trend_table)
            else:
                story.append(Paragraph("No trend data available for this period.", styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 30))
        story.append(Paragraph("— End of Report —", styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def export_to_excel(self, report_data: Dict[str, Any], report_type: str = "summary") -> bytes:
        """Export report to Excel with full data"""
        import io
        
        buffer = io.BytesIO()
        
        try:
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                if report_type == "summary":
                    # Statistics sheet
                    if isinstance(report_data.get("statistics"), dict) and report_data["statistics"]:
                        df_stats = pd.DataFrame([report_data["statistics"]])
                        df_stats.to_excel(writer, sheet_name="Statistics", index=False)
                    
                    # Period info
                    if report_data.get("start_date") and report_data.get("end_date"):
                        period_data = {
                            "Start Date": [report_data["start_date"][:10]],
                            "End Date": [report_data["end_date"][:10]],
                            "Generated": [report_data.get("generated_at", datetime.now().isoformat())[:10]]
                        }
                        df_period = pd.DataFrame(period_data)
                        df_period.to_excel(writer, sheet_name="Period", index=False)
                
                # Insights sheet
                if isinstance(report_data.get("insights"), list) and report_data["insights"]:
                    df_insights = pd.DataFrame({"AI Insights": report_data["insights"]})
                    df_insights.to_excel(writer, sheet_name="AI Insights", index=False)
                
                # Recommendations sheet
                if isinstance(report_data.get("recommendations"), list) and report_data["recommendations"]:
                    df_rec = pd.DataFrame({"Recommendations": report_data["recommendations"]})
                    df_rec.to_excel(writer, sheet_name="Recommendations", index=False)
                
                # Trends sheet
                if isinstance(report_data.get("trends"), list) and report_data["trends"]:
                    df_trends = pd.DataFrame(report_data["trends"])
                    df_trends.to_excel(writer, sheet_name="Trends", index=False)
                
                # Performance sheet (for performance report)
                if report_type == "performance":
                    if isinstance(report_data.get("users"), dict) and report_data["users"]:
                        df_users = pd.DataFrame([report_data["users"]])
                        df_users.to_excel(writer, sheet_name="Users", index=False)
                    
                    if isinstance(report_data.get("citizens"), dict) and report_data["citizens"]:
                        df_citizens = pd.DataFrame([report_data["citizens"]])
                        df_citizens.to_excel(writer, sheet_name="Citizens", index=False)
                    
                    if isinstance(report_data.get("reports"), dict) and report_data["reports"]:
                        df_reports = pd.DataFrame([report_data["reports"]])
                        df_reports.to_excel(writer, sheet_name="Reports", index=False)
        except Exception as e:
            print(f"Excel export error: {e}")
            # Fallback: create a simple error sheet
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                error_df = pd.DataFrame({"Error": [str(e)]})
                error_df.to_excel(writer, sheet_name="Error", index=False)
        
        buffer.seek(0)
        return buffer.getvalue()
    
    def _generate_insights(self, data: Dict[str, Any]) -> List[str]:
        """Generate AI insights based on data"""
        
        insights = []
        
        resolution_rate = data.get("resolution_rate", 0)
        if resolution_rate > 75:
            insights.append(f"✅ Excellent resolution rate of {resolution_rate}%. The system is performing very well.")
        elif resolution_rate > 50:
            insights.append(f"📈 Good resolution rate of {resolution_rate}%. Continue current strategies.")
        elif resolution_rate > 25:
            insights.append(f"⚠️ Resolution rate is {resolution_rate}%. Consider implementing additional search strategies.")
        elif resolution_rate > 0:
            insights.append(f"🔴 Critical: Resolution rate is only {resolution_rate}%. Urgent review needed.")
        else:
            insights.append("📊 No resolved cases in this period. Focus on active investigations.")
        
        new_cases = data.get("new_cases", 0)
        if new_cases > 100:
            insights.append(f"🚨 High number of new cases ({new_cases}). Consider allocating more resources.")
        elif new_cases > 50:
            insights.append(f"📊 Significant increase in new cases ({new_cases}). Monitor closely.")
        elif new_cases > 0:
            insights.append(f"📈 {new_cases} new cases reported during this period.")
        else:
            insights.append("✅ No new cases reported. Great job!")
        
        return insights
    
    def _get_trends(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get trend data over time - using alerts for citizen reports"""
        
        trends = []
        current = start_date
        
        while current <= end_date:
            next_day = current + timedelta(days=1)
            
            daily_missing = self.db.query(Gallery).filter(
                Gallery.status == "missing",
                Gallery.created_at >= current,
                Gallery.created_at < next_day
            ).count()
            
            # FIX: Daily reports from citizens = non-public alerts created in this day
            daily_reports = self.db.query(Alert).filter(
                Alert.created_at >= current,
                Alert.created_at < next_day,
                Alert.is_public == False
            ).count()
            
            trends.append({
                "date": current.strftime("%Y-%m-%d"),
                "new_missing": daily_missing,
                "reports": daily_reports
            })
            
            current = next_day
        
        return trends
    
    def _analyze_person_case(self, person: Gallery, reports: List) -> Dict[str, Any]:
        """Analyze a specific person's case"""
        
        analysis = {
            "risk_level": "Medium",
            "recommendations": [],
            "summary": ""
        }
        
        report_count = len(reports)
        
        if report_count > 10:
            analysis["risk_level"] = "High"
            analysis["recommendations"].append("Multiple reports received. Prioritize this case.")
        elif report_count > 5:
            analysis["risk_level"] = "Medium"
            analysis["recommendations"].append("Several reports received. Continue monitoring.")
        
        if person.status == "missing":
            days_missing = (datetime.now() - person.created_at).days if person.created_at else 0
            if days_missing > 30:
                analysis["recommendations"].append(f"Case active for {days_missing} days. Consider expanding search area.")
                analysis["risk_level"] = "High"
            analysis["summary"] = f"Person '{person.name}' has been missing for {days_missing} days with {report_count} citizen reports."
        else:
            analysis["summary"] = f"Person '{person.name}' is currently {person.status}."
        
        return analysis
    
    def _get_recommendations(self) -> List[str]:
        """Get system recommendations"""
        
        recommendations = []
        
        pending = self.db.query(CitizenReport).filter(CitizenReport.status == "pending").count()
        if pending > 10:
            recommendations.append(f"📋 {pending} pending citizen reports need review")
        
        missing = self.db.query(Gallery).filter(Gallery.status == "missing").count()
        if missing > 50:
            recommendations.append("👥 High number of missing persons. Consider public awareness campaign")
        
        active_citizens = self.db.query(Citizen).filter(Citizen.is_active == True).count()
        if active_citizens < 10:
            recommendations.append("🤝 Low citizen engagement. Promote the citizen reporting portal")
        
        if not recommendations:
            recommendations.append("✅ System is operating within normal parameters")
        
        return recommendations